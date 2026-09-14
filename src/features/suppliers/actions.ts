"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { suppliers, NewSupplier } from "@/db/schema/suppliers";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { generateUUID } from "@/lib/server/crypto";
import { logAudit } from "@/lib/server/audit";

export async function createSupplierAction(
  prevState: { error?: string; success?: boolean; supplierId?: string } | null,
  formData: FormData
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:purchases");

    const legalName = formData.get("legalName") as string;
    const tradeName = formData.get("tradeName") as string;
    const document = formData.get("document") as string;
    const phone = formData.get("phone") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zipCode = formData.get("zipCode") as string;
    const notes = formData.get("notes") as string;

    if (!legalName || legalName.trim().length === 0) {
      return { error: "A razão social do fornecedor é obrigatória." };
    }

    const supplierId = generateUUID();

    const newSupplier: NewSupplier = {
      id: supplierId,
      companyId,
      legalName: legalName.trim(),
      tradeName: tradeName?.trim() || legalName.trim(),
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

    await db.insert(suppliers).values(newSupplier);

    await logAudit({
      companyId,
      userId: user.id,
      action: "CREATE",
      entity: "suppliers",
      entityId: supplierId,
      newData: { legalName: newSupplier.legalName, document: newSupplier.document },
    });

    revalidatePath("/dashboard/suppliers");
    return { success: true, supplierId };
  } catch (err: any) {
    return { error: err.message || "Erro ao cadastrar fornecedor." };
  }
}
