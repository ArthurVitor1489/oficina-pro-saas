"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { workOrders, workOrderItems, WorkOrderStatus, NewWorkOrder, NewWorkOrderItem } from "@/db/schema/work_orders";
import { products } from "@/db/schema/products";
import { services } from "@/db/schema/services";
import { stockMovements } from "@/db/schema/stock_movements";
import { customers } from "@/db/schema/customers";
import { getTenantContext, requireTenantPermission } from "@/lib/server/tenant-context";
import { hasPermission } from "@/lib/server/rbac";
import { generateUUID } from "@/lib/server/crypto";
import { logAudit } from "@/lib/server/audit";
import { eq, and, sql } from "drizzle-orm";

export async function createWorkOrderAction(
  prevState: { error?: string; success?: boolean; workOrderId?: string } | null,
  formData: FormData
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:work_orders");

    const customerId = formData.get("customerId") as string;
    const vehicleId = (formData.get("vehicleId") as string) || null;
    const assignedUserId = (formData.get("assignedUserId") as string) || null;
    const notes = formData.get("notes") as string;
    const internalNotes = formData.get("internalNotes") as string;

    if (!customerId) {
      return { error: "Selecione o cliente da Ordem de Serviço." };
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

    // Obter próximo número sequencial da OS no tenant
    const lastOrder = await db
      .select({ maxNum: sql<number>`COALESCE(MAX(${workOrders.orderNumber}), 0)` })
      .from(workOrders)
      .where(eq(workOrders.companyId, companyId));

    const orderNumber = (lastOrder[0]?.maxNum || 0) + 1;
    const workOrderId = generateUUID();

    const newOrder: NewWorkOrder = {
      id: workOrderId,
      companyId,
      orderNumber,
      customerId,
      vehicleId,
      assignedUserId,
      status: "OPEN",
      notes: notes?.trim() || null,
      internalNotes: internalNotes?.trim() || null,
      subtotalCents: 0,
      discountCents: 0,
      totalCents: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(workOrders).values(newOrder);

    await logAudit({
      companyId,
      userId: user.id,
      action: "CREATE",
      entity: "work_orders",
      entityId: workOrderId,
      newData: { orderNumber, customerId, vehicleId, assignedUserId },
    });

    revalidatePath("/dashboard/work-orders");
    revalidatePath("/dashboard");
    return { success: true, workOrderId };
  } catch (err: any) {
    return { error: err.message || "Erro ao abrir Ordem de Serviço." };
  }
}

export async function updateWorkOrderStatusAction(
  orderId: string,
  newStatus: WorkOrderStatus
) {
  try {
    const { companyId, user } = await getTenantContext();

    if (!hasPermission(user.role, "update_status:work_orders")) {
      return { error: "Você não tem permissão para alterar o status da Ordem de Serviço." };
    }

    const existing = await db
      .select()
      .from(workOrders)
      .where(and(eq(workOrders.id, orderId), eq(workOrders.companyId, companyId)))
      .limit(1);

    if (existing.length === 0) {
      return { error: "Ordem de Serviço não encontrada nesta oficina." };
    }

    const current = existing[0];
    const updateData: Partial<typeof workOrders.$inferInsert> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    // Atualização de timestamps operacionais
    if (newStatus === "IN_PROGRESS" && !current.startedAt) {
      updateData.startedAt = new Date();
    } else if (newStatus === "FINISHED" && !current.finishedAt) {
      updateData.finishedAt = new Date();
    } else if (newStatus === "DELIVERED" && !current.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    await db
      .update(workOrders)
      .set(updateData)
      .where(and(eq(workOrders.id, orderId), eq(workOrders.companyId, companyId)));

    await logAudit({
      companyId,
      userId: user.id,
      action: "STATUS_CHANGE",
      entity: "work_orders",
      entityId: orderId,
      oldData: { status: current.status },
      newData: { status: newStatus },
    });

    revalidatePath("/dashboard/work-orders");
    revalidatePath(`/dashboard/work-orders/${orderId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao atualizar status da OS." };
  }
}

export async function addWorkOrderItemAction(
  orderId: string,
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  try {
    const { companyId, user } = await getTenantContext();

    if (!hasPermission(user.role, "add_items:work_orders")) {
      return { error: "Você não possui permissão para adicionar itens nesta OS." };
    }

    const type = formData.get("type") as "SERVICE" | "PRODUCT";
    const serviceId = (formData.get("serviceId") as string) || null;
    const productId = (formData.get("productId") as string) || null;
    const description = formData.get("description") as string;
    const quantityStr = (formData.get("quantity") as string) || "1";
    const priceStr = formData.get("unitPrice") as string;

    if (!type || !description || !priceStr) {
      return { error: "Tipo, descrição e preço são obrigatórios." };
    }

    const quantity = parseInt(quantityStr, 10) || 1;
    const parsedPrice = parseFloat(priceStr.replace(",", "."));
    const unitPriceCents = Math.round(parsedPrice * 100);
    const totalItemCents = quantity * unitPriceCents;

    // Buscar OS
    const orderList = await db
      .select()
      .from(workOrders)
      .where(and(eq(workOrders.id, orderId), eq(workOrders.companyId, companyId)))
      .limit(1);

    if (orderList.length === 0) {
      return { error: "Ordem de Serviço não encontrada." };
    }

    const order = orderList[0];
    const itemId = generateUUID();

    // 1. Inserir item na OS
    const newItem: NewWorkOrderItem = {
      id: itemId,
      companyId,
      workOrderId: orderId,
      type,
      serviceId,
      productId,
      assignedUserId: user.id,
      description: description.trim(),
      quantity,
      unitPriceCents,
      discountCents: 0,
      totalCents: totalItemCents,
      completed: true,
    };

    await db.insert(workOrderItems).values(newItem);

    // 2. Se for PEÇA / PRODUTO: dar baixa no estoque e gerar movimentação OBRIGATÓRIA
    if (type === "PRODUCT" && productId) {
      const prodList = await db
        .select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.companyId, companyId)))
        .limit(1);

      if (prodList.length > 0) {
        const prod = prodList[0];
        const newStock = Math.max(0, prod.stockQuantity - quantity);

        await db
          .update(products)
          .set({
            stockQuantity: newStock,
            updatedAt: new Date(),
          })
          .where(and(eq(products.id, productId), eq(products.companyId, companyId)));

        // Registrar saída de estoque por Ordem de Serviço
        await db.insert(stockMovements).values({
          id: generateUUID(),
          companyId,
          productId,
          type: "WORK_ORDER",
          quantity: -quantity, // Saída
          unitCostCents: prod.costPriceCents,
          referenceType: "WORK_ORDER",
          referenceId: orderId,
          userId: user.id,
          notes: `Aplicação na OS #${order.orderNumber}`,
          createdAt: new Date(),
        });
      }
    }

    // 3. Atualizar totais da OS
    const newSubtotal = order.subtotalCents + totalItemCents;
    const newTotal = Math.max(0, newSubtotal - order.discountCents);

    await db
      .update(workOrders)
      .set({
        subtotalCents: newSubtotal,
        totalCents: newTotal,
        updatedAt: new Date(),
      })
      .where(and(eq(workOrders.id, orderId), eq(workOrders.companyId, companyId)));

    await logAudit({
      companyId,
      userId: user.id,
      action: "UPDATE",
      entity: "work_orders",
      entityId: orderId,
      newData: { addedItem: description, type, quantity, totalItemCents, newTotal },
    });

    revalidatePath(`/dashboard/work-orders/${orderId}`);
    revalidatePath("/dashboard/work-orders");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao adicionar item na OS." };
  }
}
