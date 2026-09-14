"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { quotes, quoteItems, QuoteStatus, ItemType, NewQuote, NewQuoteItem } from "@/db/schema/quotes";
import { workOrders, workOrderItems, NewWorkOrder, NewWorkOrderItem } from "@/db/schema/work_orders";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { generateUUID } from "@/lib/server/crypto";
import { logAudit } from "@/lib/server/audit";
import { eq, and, sql } from "drizzle-orm";

export interface CreateQuoteItemInput {
  type: ItemType;
  serviceId?: string | null;
  productId?: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents?: number;
}

export async function createQuoteAction(
  prevState: { error?: string; success?: boolean; quoteId?: string } | null,
  formData: FormData
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:quotes");

    const customerId = formData.get("customerId") as string;
    const vehicleId = (formData.get("vehicleId") as string) || null;
    const notes = (formData.get("notes") as string) || null;
    const itemsJson = formData.get("itemsJson") as string;
    const discountStr = formData.get("discount") as string;
    const validDaysStr = (formData.get("validDays") as string) || "15";

    if (!customerId) {
      return { error: "Selecione o cliente para o orçamento." };
    }

    // Validar cliente no tenant
    const customer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.companyId, companyId)))
      .limit(1);

    if (customer.length === 0) {
      return { error: "Cliente não encontrado ou não pertence a esta oficina." };
    }

    // Parse dos itens
    let items: CreateQuoteItemInput[] = [];
    try {
      items = itemsJson ? JSON.parse(itemsJson) : [];
    } catch {
      return { error: "Erro na leitura dos itens do orçamento." };
    }

    if (items.length === 0) {
      return { error: "Adicione ao menos um serviço ou peça ao orçamento." };
    }

    // Obter próximo número sequencial do orçamento no tenant
    const lastQuote = await db
      .select({ maxNum: sql<number>`COALESCE(MAX(${quotes.quoteNumber}), 0)` })
      .from(quotes)
      .where(eq(quotes.companyId, companyId));

    const quoteNumber = (lastQuote[0]?.maxNum || 0) + 1;
    const quoteId = generateUUID();

    // Calcular totais
    let subtotalCents = 0;
    for (const item of items) {
      const itemSubtotal = item.quantity * item.unitPriceCents - (item.discountCents || 0);
      subtotalCents += Math.max(0, itemSubtotal);
    }

    const discountVal = discountStr ? parseFloat(discountStr.replace(",", ".")) : 0;
    const discountCents = Math.round(discountVal * 100);
    const totalCents = Math.max(0, subtotalCents - discountCents);

    const validDays = parseInt(validDaysStr, 10) || 15;
    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

    const newQuote: NewQuote = {
      id: quoteId,
      companyId,
      quoteNumber,
      customerId,
      vehicleId,
      status: "DRAFT",
      validUntil,
      notes,
      subtotalCents,
      discountCents,
      totalCents,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(quotes).values(newQuote);

    // Inserir itens
    for (const item of items) {
      const itemTotalCents = Math.max(0, item.quantity * item.unitPriceCents - (item.discountCents || 0));
      const newItem: NewQuoteItem = {
        id: generateUUID(),
        companyId,
        quoteId,
        type: item.type,
        serviceId: item.serviceId || null,
        productId: item.productId || null,
        description: item.description.trim(),
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        discountCents: item.discountCents || 0,
        totalCents: itemTotalCents,
      };
      await db.insert(quoteItems).values(newItem);
    }

    await logAudit({
      companyId,
      userId: user.id,
      action: "CREATE",
      entity: "quotes",
      entityId: quoteId,
      newData: { quoteNumber, customerId, totalCents, itemsCount: items.length },
    });

    revalidatePath("/dashboard/quotes");
    revalidatePath(`/dashboard/customers/${customerId}`);
    return { success: true, quoteId };
  } catch (err: any) {
    return { error: err.message || "Erro ao gerar orçamento." };
  }
}

export async function updateQuoteStatusAction(
  quoteId: string,
  newStatus: QuoteStatus
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:quotes");

    const existing = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)))
      .limit(1);

    if (existing.length === 0) {
      return { error: "Orçamento não encontrado nesta oficina." };
    }

    await db
      .update(quotes)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)));

    await logAudit({
      companyId,
      userId: user.id,
      action: "STATUS_CHANGE",
      entity: "quotes",
      entityId: quoteId,
      oldData: { status: existing[0].status },
      newData: { status: newStatus },
    });

    revalidatePath("/dashboard/quotes");
    revalidatePath(`/dashboard/quotes/${quoteId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao atualizar status do orçamento." };
  }
}

/**
 * Converte um Orçamento aprovado diretamente em Ordem de Serviço (OS).
 * Todos os itens (serviços e peças) são copiados para a OS.
 */
export async function convertQuoteToWorkOrderAction(quoteId: string) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:work_orders");

    // Buscar orçamento do tenant
    const quoteList = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)))
      .limit(1);

    if (quoteList.length === 0) {
      return { error: "Orçamento não encontrado nesta oficina." };
    }

    const quote = quoteList[0];

    if (quote.status === "CONVERTED" && quote.convertedToWorkOrderId) {
      return {
        error: "Este orçamento já foi convertido em uma Ordem de Serviço.",
        workOrderId: quote.convertedToWorkOrderId,
      };
    }

    // Buscar itens do orçamento
    const items = await db
      .select()
      .from(quoteItems)
      .where(and(eq(quoteItems.quoteId, quoteId), eq(quoteItems.companyId, companyId)));

    // Obter próximo número sequencial da OS no tenant
    const lastOrder = await db
      .select({ maxNum: sql<number>`COALESCE(MAX(${workOrders.orderNumber}), 0)` })
      .from(workOrders)
      .where(eq(workOrders.companyId, companyId));

    const orderNumber = (lastOrder[0]?.maxNum || 0) + 1;
    const workOrderId = generateUUID();

    // Inserir nova OS
    const newWorkOrder: NewWorkOrder = {
      id: workOrderId,
      companyId,
      orderNumber,
      customerId: quote.customerId,
      vehicleId: quote.vehicleId,
      assignedUserId: null,
      status: "APPROVED", // Já nasce aprovada pois veio de orçamento aprovado
      notes: quote.notes ? `Convertido do Orçamento #${quote.quoteNumber}. ${quote.notes}` : `Convertido do Orçamento #${quote.quoteNumber}`,
      internalNotes: null,
      subtotalCents: quote.subtotalCents,
      discountCents: quote.discountCents,
      totalCents: quote.totalCents,
      fromQuoteId: quote.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(workOrders).values(newWorkOrder);

    // Copiar todos os itens do orçamento para a OS
    for (const item of items) {
      const newWoItem: NewWorkOrderItem = {
        id: generateUUID(),
        companyId,
        workOrderId,
        type: item.type,
        serviceId: item.serviceId,
        productId: item.productId,
        assignedUserId: null,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        discountCents: item.discountCents,
        totalCents: item.totalCents,
        completed: false,
      };
      await db.insert(workOrderItems).values(newWoItem);
    }

    // Atualizar status do orçamento para CONVERTED
    await db
      .update(quotes)
      .set({
        status: "CONVERTED",
        convertedToWorkOrderId: workOrderId,
        updatedAt: new Date(),
      })
      .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)));

    await logAudit({
      companyId,
      userId: user.id,
      action: "STATUS_CHANGE",
      entity: "quotes",
      entityId: quoteId,
      oldData: { status: quote.status },
      newData: { status: "CONVERTED", convertedToWorkOrderId: workOrderId, orderNumber },
    });

    await logAudit({
      companyId,
      userId: user.id,
      action: "CREATE",
      entity: "work_orders",
      entityId: workOrderId,
      newData: { orderNumber, fromQuoteId: quoteId, totalCents: quote.totalCents },
    });

    revalidatePath("/dashboard/quotes");
    revalidatePath(`/dashboard/quotes/${quoteId}`);
    revalidatePath("/dashboard/work-orders");
    return { success: true, workOrderId };
  } catch (err: any) {
    return { error: err.message || "Erro ao converter orçamento em OS." };
  }
}
