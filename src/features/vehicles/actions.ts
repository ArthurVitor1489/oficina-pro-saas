"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { vehicles, NewVehicle } from "@/db/schema/vehicles";
import { customers } from "@/db/schema/customers";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { generateUUID } from "@/lib/server/crypto";
import { logAudit } from "@/lib/server/audit";
import { eq, and } from "drizzle-orm";

export async function createVehicleAction(
  prevState: { error?: string; success?: boolean; vehicleId?: string } | null,
  formData: FormData
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:vehicles");

    const customerId = formData.get("customerId") as string;
    const plate = formData.get("plate") as string;
    const brand = formData.get("brand") as string;
    const model = formData.get("model") as string;
    const yearStr = formData.get("year") as string;
    const version = formData.get("version") as string;
    const fuelType = formData.get("fuelType") as string;
    const mileageStr = formData.get("mileage") as string;
    const notes = formData.get("notes") as string;

    if (!customerId || !plate || !brand || !model) {
      return { error: "Cliente, placa, marca e modelo são obrigatórios." };
    }

    // Validar se o cliente pertence à oficina
    const customer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.companyId, companyId)))
      .limit(1);

    if (customer.length === 0) {
      return { error: "Cliente selecionado não foi encontrado nesta oficina." };
    }

    const cleanPlate = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleanPlate.length < 7) {
      return { error: "Placa inválida. Insira ao menos 7 caracteres alfanuméricos." };
    }

    const vehicleId = generateUUID();
    const year = yearStr ? parseInt(yearStr, 10) : null;
    const mileage = mileageStr ? parseInt(mileageStr, 10) : 0;

    const newVehicle: NewVehicle = {
      id: vehicleId,
      companyId,
      customerId,
      plate: cleanPlate,
      brand: brand.trim(),
      model: model.trim(),
      year,
      version: version?.trim() || null,
      fuelType: fuelType || "FLEX",
      mileage,
      notes: notes?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(vehicles).values(newVehicle);

    await logAudit({
      companyId,
      userId: user.id,
      action: "CREATE",
      entity: "vehicles",
      entityId: vehicleId,
      newData: { plate: cleanPlate, brand, model, customerId },
    });

    revalidatePath("/dashboard/vehicles");
    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${customerId}`);
    revalidatePath("/dashboard");
    return { success: true, vehicleId };
  } catch (err: any) {
    return { error: err.message || "Erro ao cadastrar veículo." };
  }
}
