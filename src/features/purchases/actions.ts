"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { purchases, purchaseItems, PurchaseStatus, NewPurchase, NewPurchaseItem } from "@/db/schema/purchases";
import { products } from "@/db/schema/products";
import { suppliers } from "@/db/schema/suppliers";
import { stockMovements } from "@/db/schema/stock_movements";
import { financialTransactions, NewFinancialTransaction } from "@/db/schema/finance";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { generateUUID } from "@/lib/server/crypto";
import { logAudit } from "@/lib/server/audit";
import { eq, and, sql } from "drizzle-orm";

export interface CreatePurchaseItemInput {
  productId: string;
  quantity: number;
  unitCostCents: number;
}

export async function createPurchaseAction(
  prevState: { error?: string; success?: boolean; purchaseId?: string } | null,
  formData: FormData
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:purchases");

    const supplierId = formData.get("supplierId") as string;
    const invoiceNumber = (formData.get("invoiceNumber") as string) || null;
    const paymentTerms = (formData.get("paymentTerms") as string) || "À Vista";
    const dueDateStr = (formData.get("dueDate") as string) || null;
    const notes = (formData.get("notes") as string) || null;
    const itemsJson = formData.get("itemsJson") as string;
    const freightStr = (formData.get("freight") as string) || "0";
    const discountStr = (formData.get("discount") as string) || "0";
    const autoConfirm = formData.get("autoConfirm") === "true";

    if (!supplierId) {
      return { error: "Selecione o fornecedor da compra." };
    }

    // Validar fornecedor no tenant
    const supplier = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, supplierId), eq(suppliers.companyId, companyId)))
      .limit(1);

    if (supplier.length === 0) {
      return { error: "Fornecedor não encontrado nesta oficina." };
    }

    let items: CreatePurchaseItemInput[] = [];
    try {
      items = itemsJson ? JSON.parse(itemsJson) : [];
    } catch {
      return { error: "Erro no formato dos itens da compra." };
    }

    if (items.length === 0) {
      return { error: "Adicione ao menos um produto/peça na compra." };
    }

    // Obter número sequencial da compra
    const lastPurchase = await db
      .select({ maxNum: sql<number>`COALESCE(MAX(${purchases.purchaseNumber}), 0)` })
      .from(purchases)
      .where(eq(purchases.companyId, companyId));

    const purchaseNumber = (lastPurchase[0]?.maxNum || 0) + 1;
    const purchaseId = generateUUID();

    // Calcular subtotais e totais
    let subtotalCents = 0;
    for (const item of items) {
      subtotalCents += item.quantity * item.unitCostCents;
    }

    const freightVal = parseFloat(freightStr.replace(",", ".")) || 0;
    const discountVal = parseFloat(discountStr.replace(",", ".")) || 0;
    const freightCents = Math.round(freightVal * 100);
    const discountCents = Math.round(discountVal * 100);
    const totalCents = Math.max(0, subtotalCents + freightCents - discountCents);

    const initialStatus: PurchaseStatus = autoConfirm ? "CONFIRMED" : "DRAFT";

    const newPurchase: NewPurchase = {
      id: purchaseId,
      companyId,
      purchaseNumber,
      supplierId,
      invoiceNumber: invoiceNumber?.trim() || null,
      status: initialStatus,
      purchaseDate: new Date(),
      subtotalCents,
      freightCents,
      discountCents,
      totalCents,
      paymentTerms: paymentTerms?.trim() || null,
      notes: notes?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(purchases).values(newPurchase);

    // Inserir itens da compra
    for (const item of items) {
      const totalCostCents = item.quantity * item.unitCostCents;
      const newPurchaseItem: NewPurchaseItem = {
        id: generateUUID(),
        companyId,
        purchaseId,
        productId: item.productId,
        quantity: item.quantity,
        unitCostCents: item.unitCostCents,
        totalCostCents,
      };
      await db.insert(purchaseItems).values(newPurchaseItem);
    }

    // REGRA DE NEGÓCIO: Se confirmada automaticamente, alimenta estoque e cria contas a pagar
    if (autoConfirm) {
      for (const item of items) {
        // Atualizar saldo do produto e último custo
        const prod = (
          await db
            .select()
            .from(products)
            .where(and(eq(products.id, item.productId), eq(products.companyId, companyId)))
        )[0];

        if (prod) {
          const newStock = prod.stockQuantity + item.quantity;
          await db
            .update(products)
            .set({
              stockQuantity: newStock,
              costPriceCents: item.unitCostCents,
              updatedAt: new Date(),
            })
            .where(and(eq(products.id, item.productId), eq(products.companyId, companyId)));

          // Registrar movimentação de estoque
          await db.insert(stockMovements).values({
            id: generateUUID(),
            companyId,
            productId: item.productId,
            type: "PURCHASE",
            quantity: item.quantity,
            unitCostCents: item.unitCostCents,
            referenceType: "PURCHASE",
            referenceId: purchaseId,
            userId: user.id,
            notes: `Entrada por Compra #${purchaseNumber} (NF: ${invoiceNumber || "S/N"})`,
            createdAt: new Date(),
          });
        }
      }

      // Criar Conta a Pagar correspondente no Módulo Financeiro
      const dueDate = dueDateStr
        ? new Date(dueDateStr)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias padrão

      const newPayable: NewFinancialTransaction = {
        id: generateUUID(),
        companyId,
        type: "PAYABLE",
        status: "PENDING",
        category: "Peças e Insumos",
        description: `Compra #${purchaseNumber} - ${supplier[0].tradeName || supplier[0].legalName} (NF: ${
          invoiceNumber || "S/N"
        })`,
        amountCents: totalCents,
        paidAmountCents: 0,
        dueDate,
        paidAt: null,
        referenceType: "PURCHASE",
        referenceId: purchaseId,
        customerId: null,
        supplierId,
        paymentMethod: paymentTerms,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(financialTransactions).values(newPayable);
    }

    await logAudit({
      companyId,
      userId: user.id,
      action: "CREATE",
      entity: "purchases",
      entityId: purchaseId,
      newData: { purchaseNumber, supplierId, totalCents, autoConfirm },
    });

    revalidatePath("/dashboard/purchases");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard");
    return { success: true, purchaseId };
  } catch (err: any) {
    return { error: err.message || "Erro ao registrar compra." };
  }
}

export async function confirmPurchaseAction(purchaseId: string) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:purchases");

    const purchaseList = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.id, purchaseId), eq(purchases.companyId, companyId)))
      .limit(1);

    if (purchaseList.length === 0) {
      return { error: "Compra não encontrada." };
    }

    const purchase = purchaseList[0];

    if (purchase.status === "CONFIRMED") {
      return { error: "Esta compra já foi confirmada anteriormente." };
    }

    // Buscar itens
    const items = await db
      .select()
      .from(purchaseItems)
      .where(and(eq(purchaseItems.purchaseId, purchaseId), eq(purchaseItems.companyId, companyId)));

    // 1. Atualizar estoque de cada item e gerar movimentação
    for (const item of items) {
      const prod = (
        await db
          .select()
          .from(products)
          .where(and(eq(products.id, item.productId), eq(products.companyId, companyId)))
      )[0];

      if (prod) {
        const newStock = prod.stockQuantity + item.quantity;
        await db
          .update(products)
          .set({
            stockQuantity: newStock,
            costPriceCents: item.unitCostCents,
            updatedAt: new Date(),
          })
          .where(and(eq(products.id, item.productId), eq(products.companyId, companyId)));

        await db.insert(stockMovements).values({
          id: generateUUID(),
          companyId,
          productId: item.productId,
          type: "PURCHASE",
          quantity: item.quantity,
          unitCostCents: item.unitCostCents,
          referenceType: "PURCHASE",
          referenceId: purchaseId,
          userId: user.id,
          notes: `Confirmação de Compra #${purchase.purchaseNumber}`,
          createdAt: new Date(),
        });
      }
    }

    // 2. Criar Conta a Pagar se ainda não existir
    const existingPayable = await db
      .select()
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.companyId, companyId),
          eq(financialTransactions.referenceType, "PURCHASE"),
          eq(financialTransactions.referenceId, purchaseId)
        )
      )
      .limit(1);

    if (existingPayable.length === 0) {
      const supplier = (
        await db
          .select()
          .from(suppliers)
          .where(eq(suppliers.id, purchase.supplierId))
      )[0];

      await db.insert(financialTransactions).values({
        id: generateUUID(),
        companyId,
        type: "PAYABLE",
        status: "PENDING",
        category: "Peças e Insumos",
        description: `Compra #${purchase.purchaseNumber} - ${supplier?.tradeName || "Fornecedor"} (NF: ${
          purchase.invoiceNumber || "S/N"
        })`,
        amountCents: purchase.totalCents,
        paidAmountCents: 0,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paidAt: null,
        referenceType: "PURCHASE",
        referenceId: purchaseId,
        customerId: null,
        supplierId: purchase.supplierId,
        paymentMethod: purchase.paymentTerms,
        notes: purchase.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 3. Atualizar status da compra
    await db
      .update(purchases)
      .set({ status: "CONFIRMED", updatedAt: new Date() })
      .where(and(eq(purchases.id, purchaseId), eq(purchases.companyId, companyId)));

    await logAudit({
      companyId,
      userId: user.id,
      action: "STATUS_CHANGE",
      entity: "purchases",
      entityId: purchaseId,
      oldData: { status: purchase.status },
      newData: { status: "CONFIRMED" },
    });

    revalidatePath("/dashboard/purchases");
    revalidatePath(`/dashboard/purchases/${purchaseId}`);
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao confirmar compra." };
  }
}
