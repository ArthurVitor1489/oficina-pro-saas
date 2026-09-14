"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { customers, NewCustomer } from "@/db/schema/customers";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { generateUUID } from "@/lib/server/crypto";
import { logAudit } from "@/lib/server/audit";
import { eq, and } from "drizzle-orm";

export async function createCustomerAction(
  prevState: { error?: string; success?: boolean; customerId?: string } | null,
  formData: FormData
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:customers");

    const name = formData.get("name") as string;
    const document = formData.get("document") as string;
    const phone = formData.get("phone") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zipCode = formData.get("zipCode") as string;
    const notes = formData.get("notes") as string;

    if (!name || name.trim().length === 0) {
      return { error: "O nome do cliente é obrigatório." };
    }

    const customerId = generateUUID();

    const newCustomer: NewCustomer = {
      id: customerId,
      companyId,
      name: name.trim(),
      document: document?.trim() || null,
      phone: phone?.trim() || null,
      whatsapp: whatsapp?.trim() || phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zipCode: zipCode?.trim() || null,
      notes: notes?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(customers).values(newCustomer);

    await logAudit({
      companyId,
      userId: user.id,
      action: "CREATE",
      entity: "customers",
      entityId: customerId,
      newData: { name: newCustomer.name, document: newCustomer.document },
    });

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard");
    return { success: true, customerId };
  } catch (err: any) {
    return { error: err.message || "Erro ao cadastrar cliente." };
  }
}

export async function updateCustomerAction(
  id: string,
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:customers");

    // Verificar se o cliente pertence à oficina
    const existing = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)))
      .limit(1);

    if (existing.length === 0) {
      return { error: "Cliente não encontrado ou não pertence a esta oficina." };
    }

    const name = formData.get("name") as string;
    const document = formData.get("document") as string;
    const phone = formData.get("phone") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zipCode = formData.get("zipCode") as string;
    const notes = formData.get("notes") as string;

    if (!name || name.trim().length === 0) {
      return { error: "O nome do cliente é obrigatório." };
    }

    await db
      .update(customers)
      .set({
        name: name.trim(),
        document: document?.trim() || null,
        phone: phone?.trim() || null,
        whatsapp: whatsapp?.trim() || phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        zipCode: zipCode?.trim() || null,
        notes: notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)));

    await logAudit({
      companyId,
      userId: user.id,
      action: "UPDATE",
      entity: "customers",
      entityId: id,
      oldData: { name: existing[0].name, phone: existing[0].phone },
      newData: { name, phone },
    });

    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${id}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao atualizar cliente." };
  }
}
