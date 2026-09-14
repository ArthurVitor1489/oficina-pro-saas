"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products, NewProduct } from "@/db/schema/products";
import { stockMovements, StockMovementType } from "@/db/schema/stock_movements";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { generateUUID } from "@/lib/server/crypto";
import { logAudit } from "@/lib/server/audit";
import { eq, and } from "drizzle-orm";

export async function createProductAction(
  prevState: { error?: string; success?: boolean; productId?: string } | null,
  formData: FormData
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:inventory");

    const name = formData.get("name") as string;
    const skuCode = formData.get("skuCode") as string;
    const manufacturer = formData.get("manufacturer") as string;
    const category = formData.get("category") as string;
    const unit = (formData.get("unit") as string) || "UN";
    const costPriceStr = formData.get("costPrice") as string;
    const salePriceStr = formData.get("salePrice") as string;
    const initialStockStr = formData.get("initialStock") as string;
    const minStockStr = formData.get("minStock") as string;
    const location = formData.get("location") as string;

    if (!name || name.trim().length === 0) {
      return { error: "O nome da peça é obrigatório." };
    }

    const costPrice = costPriceStr ? parseFloat(costPriceStr.replace(",", ".")) : 0;
    const salePrice = salePriceStr ? parseFloat(salePriceStr.replace(",", ".")) : 0;
    const costPriceCents = Math.round(costPrice * 100);
    const salePriceCents = Math.round(salePrice * 100);
    const initialStock = initialStockStr ? parseInt(initialStockStr, 10) : 0;
    const minStock = minStockStr ? parseInt(minStockStr, 10) : 0;

    const productId = generateUUID();

    const newProduct: NewProduct = {
      id: productId,
      companyId,
      name: name.trim(),
      skuCode: skuCode?.trim() || null,
      manufacturer: manufacturer?.trim() || null,
      category: category?.trim() || "Geral",
      unit: unit.trim().toUpperCase(),
      costPriceCents,
      salePriceCents,
      stockQuantity: initialStock,
      minStock,
      location: location?.trim() || null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(products).values(newProduct);

    // REGRA DE OURO: Se houver saldo inicial, SEMPRE gerar movimentação correspondente
    if (initialStock > 0) {
      await db.insert(stockMovements).values({
        id: generateUUID(),
        companyId,
        productId,
        type: "ADJUSTMENT",
        quantity: initialStock,
        unitCostCents: costPriceCents,
        referenceType: "INITIAL_STOCK",
        userId: user.id,
        notes: "Saldo inicial registrado no cadastro do produto",
        createdAt: new Date(),
      });
    }

    await logAudit({
      companyId,
      userId: user.id,
      action: "CREATE",
      entity: "products",
      entityId: productId,
      newData: { name: newProduct.name, skuCode: newProduct.skuCode, initialStock },
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    return { success: true, productId };
  } catch (err: any) {
    return { error: err.message || "Erro ao cadastrar peça." };
  }
}

export async function adjustStockAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:inventory");

    const productId = formData.get("productId") as string;
    const type = formData.get("type") as StockMovementType;
    const quantityStr = formData.get("quantity") as string;
    const notes = formData.get("notes") as string;

    if (!productId || !type || !quantityStr) {
      return { error: "Produto, tipo e quantidade são obrigatórios." };
    }

    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity === 0) {
      return { error: "A quantidade informada deve ser um número diferente de zero." };
    }

    // Buscar produto garantindo o tenant
    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.companyId, companyId)))
      .limit(1);

    if (existing.length === 0) {
      return { error: "Produto não encontrado ou não pertence a esta oficina." };
    }

    const product = existing[0];
    const newStock = product.stockQuantity + quantity;

    if (newStock < 0) {
      return { error: `Estoque insuficiente. Saldo atual: ${product.stockQuantity} ${product.unit}.` };
    }

    // 1. Atualizar saldo do produto
    await db
      .update(products)
      .set({
        stockQuantity: newStock,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, productId), eq(products.companyId, companyId)));

    // 2. Registrar movimentação obrigatória em stock_movements
    await db.insert(stockMovements).values({
      id: generateUUID(),
      companyId,
      productId,
      type,
      quantity,
      unitCostCents: product.costPriceCents,
      referenceType: "MANUAL_ADJUSTMENT",
      userId: user.id,
      notes: notes?.trim() || "Ajuste manual de estoque",
      createdAt: new Date(),
    });

    // 3. Auditoria
    await logAudit({
      companyId,
      userId: user.id,
      action: "STOCK_MOVE",
      entity: "products",
      entityId: productId,
      oldData: { stockQuantity: product.stockQuantity },
      newData: { stockQuantity: newStock, quantityMoved: quantity, type },
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao realizar ajuste de estoque." };
  }
}
