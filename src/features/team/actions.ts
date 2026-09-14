"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, UserRole } from "@/db/schema/users";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { hashPassword, generateUUID } from "@/lib/server/crypto";
import { logAudit } from "@/lib/server/audit";
import { eq } from "drizzle-orm";

export async function addTeamMemberAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  try {
    const { companyId, user: currentUser } = await requireTenantPermission("manage:users");

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as UserRole;
    const password = formData.get("password") as string;

    if (!name || !email || !role || !password) {
      return { error: "Todos os campos são obrigatórios." };
    }

    if (password.length < 6) {
      return { error: "A senha deve conter no mínimo 6 caracteres." };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Checar duplicidade de e-mail
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return { error: "Este e-mail já está cadastrado no sistema." };
    }

    const newUserId = generateUUID();
    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      id: newUserId,
      companyId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await logAudit({
      companyId,
      userId: currentUser.id,
      action: "CREATE",
      entity: "users",
      entityId: newUserId,
      newData: { name, email: normalizedEmail, role },
    });

    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao adicionar membro à equipe." };
  }
}
