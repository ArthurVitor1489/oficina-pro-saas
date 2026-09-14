"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { services, NewService } from "@/db/schema/services";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { generateUUID } from "@/lib/server/crypto";
import { logAudit } from "@/lib/server/audit";

export async function createServiceAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:services");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const priceStr = formData.get("basePrice") as string;
    const durationStr = formData.get("estimatedMinutes") as string;

    if (!name || name.trim().length === 0) {
      return { error: "O nome do serviço é obrigatório." };
    }

    // Converter preço para centavos inteiros
    const parsedPrice = priceStr ? parseFloat(priceStr.replace(",", ".")) : 0;
    const basePriceCents = Math.round(parsedPrice * 100);
    const estimatedMinutes = durationStr ? parseInt(durationStr, 10) : 60;

    const serviceId = generateUUID();

    const newService: NewService = {
      id: serviceId,
      companyId,
      name: name.trim(),
      description: description?.trim() || null,
      category: category?.trim() || "Geral",
      basePriceCents,
      estimatedMinutes,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(services).values(newService);

    await logAudit({
      companyId,
      userId: user.id,
      action: "CREATE",
      entity: "services",
      entityId: serviceId,
      newData: { name: newService.name, basePriceCents },
    });

    revalidatePath("/dashboard/services");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao cadastrar serviço." };
  }
}
