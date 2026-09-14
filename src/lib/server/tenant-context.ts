import { getSession, SessionContext } from "./auth";
import { Permission, hasPermission, UserRole } from "./rbac";

export class TenantSecurityError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = "TenantSecurityError";
    this.statusCode = statusCode;
  }
}

export interface TenantContext extends SessionContext {
  companyId: string;
}

/**
 * Obtém o contexto de execução estritamente validado do tenant.
 * NUNCA aceita company_id vindo de parâmetros de requisição do cliente.
 * O company_id é derivado exclusivamente da sessão do usuário autenticado no servidor.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const session = await getSession();

  if (!session) {
    throw new TenantSecurityError("Acesso não autorizado. Sessão expirada ou inexistente.", 401);
  }

  if (session.company.status !== "ACTIVE") {
    throw new TenantSecurityError(
      `Acesso bloqueado: A empresa está com status ${session.company.status}.`,
      403
    );
  }

  return {
    ...session,
    companyId: session.company.id,
  };
}

/**
 * Valida se o usuário autenticado no tenant possui a permissão requerida.
 */
export async function requireTenantPermission(permission: Permission): Promise<TenantContext> {
  const ctx = await getTenantContext();

  if (!hasPermission(ctx.user.role as UserRole, permission)) {
    throw new TenantSecurityError(
      `Acesso negado: Perfil ${ctx.user.role} não possui a permissão '${permission}'.`,
      403
    );
  }

  return ctx;
}
