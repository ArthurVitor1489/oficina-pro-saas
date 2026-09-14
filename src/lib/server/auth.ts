import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { users, User, SafeUser } from "@/db/schema/users";
import { companies, Company } from "@/db/schema/companies";
import { sessions } from "@/db/schema/sessions";
import { generateSecureToken, generateUUID, hashPassword, verifyPassword } from "./crypto";
import { logAudit } from "./audit";
import { checkRateLimit } from "./rate-limit";

const COOKIE_NAME = "oficina_session";
const SESSION_DURATION_DAYS = 7;

export interface SessionContext {
  user: SafeUser;
  company: Company;
  sessionId: string;
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  // Buscar sessão válida
  const sessionResult = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (sessionResult.length === 0) {
    return null;
  }

  const session = sessionResult[0];

  // Buscar usuário e empresa
  const userResult = await db
    .select()
    .from(users)
    .where(and(eq(users.id, session.userId), eq(users.active, true)))
    .limit(1);

  if (userResult.length === 0) {
    return null;
  }

  const user = userResult[0];

  const companyResult = await db
    .select()
    .from(companies)
    .where(eq(companies.id, session.companyId))
    .limit(1);

  if (companyResult.length === 0) {
    return null;
  }

  const company = companyResult[0];

  // Remover hash da senha do objeto de usuário retornado
  const { passwordHash: _, ...safeUser } = user;

  return {
    user: safeUser,
    company,
    sessionId: session.id,
  };
}

export async function loginUser(
  email: string,
  password: string,
  ip?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string; session?: SessionContext }> {
  const rateKey = `login_${ip || "unknown"}`;
  const rate = checkRateLimit(rateKey, 5, 60 * 1000);

  if (!rate.success) {
    return {
      success: false,
      error: `Muitas tentativas. Tente novamente em ${Math.ceil(rate.resetMs / 1000)} segundos.`,
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (userResult.length === 0) {
    return { success: false, error: "Credenciais inválidas." };
  }

  const user = userResult[0];

  if (!user.active) {
    return { success: false, error: "Usuário inativo. Contate o administrador." };
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, error: "Credenciais inválidas." };
  }

  // Verificar empresa
  const companyResult = await db
    .select()
    .from(companies)
    .where(eq(companies.id, user.companyId))
    .limit(1);

  if (companyResult.length === 0) {
    return { success: false, error: "Empresa não encontrada." };
  }

  const company = companyResult[0];

  if (company.status !== "ACTIVE") {
    return {
      success: false,
      error: `Acesso bloqueado: A empresa está ${company.status.toLowerCase()}.`,
    };
  }

  // Criar token e sessão
  const token = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: token,
    userId: user.id,
    companyId: company.id,
    expiresAt,
    ip: ip || null,
    userAgent: userAgent || null,
    createdAt: new Date(),
  });

  await setSessionCookie(token, expiresAt);

  // Registrar login em audit_logs
  await logAudit({
    companyId: company.id,
    userId: user.id,
    action: "LOGIN",
    entity: "users",
    entityId: user.id,
    ip,
    userAgent,
  });

  const { passwordHash: _, ...safeUser } = user;

  return {
    success: true,
    session: {
      user: safeUser,
      company,
      sessionId: token,
    },
  };
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    const sessionResult = await db.select().from(sessions).where(eq(sessions.id, token)).limit(1);
    if (sessionResult.length > 0) {
      const s = sessionResult[0];
      await logAudit({
        companyId: s.companyId,
        userId: s.userId,
        action: "LOGOUT",
        entity: "users",
        entityId: s.userId,
      });
      await db.delete(sessions).where(eq(sessions.id, token));
    }
  }

  await clearSessionCookie();
}

export async function registerCompanyWithOwner(params: {
  companyName: string;
  tradeName?: string;
  document: string;
  email?: string;
  phone?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ success: boolean; error?: string; companyId?: string }> {
  const normalizedEmail = params.ownerEmail.trim().toLowerCase();

  // Verificar se o e-mail já existe
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser.length > 0) {
    return { success: false, error: "Este e-mail já está cadastrado no sistema." };
  }

  const companyId = generateUUID();
  const userId = generateUUID();
  const passwordHash = await hashPassword(params.ownerPassword);

  // Inserir empresa
  await db.insert(companies).values({
    id: companyId,
    name: params.companyName.trim(),
    tradeName: params.tradeName?.trim() || params.companyName.trim(),
    document: params.document.trim(),
    email: params.email?.trim() || normalizedEmail,
    phone: params.phone?.trim() || null,
    plan: "STARTER",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Inserir primeiro usuário como OWNER
  await db.insert(users).values({
    id: userId,
    companyId: companyId,
    name: params.ownerName.trim(),
    email: normalizedEmail,
    passwordHash: passwordHash,
    role: "OWNER",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Criar sessão automática para login imediato
  const token = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: token,
    userId: userId,
    companyId: companyId,
    expiresAt,
    ip: params.ip || null,
    userAgent: params.userAgent || null,
    createdAt: new Date(),
  });

  await setSessionCookie(token, expiresAt);

  // Registrar auditoria
  await logAudit({
    companyId,
    userId,
    action: "CREATE",
    entity: "companies",
    entityId: companyId,
    newData: { name: params.companyName, document: params.document },
    ip: params.ip,
    userAgent: params.userAgent,
  });

  return { success: true, companyId };
}
