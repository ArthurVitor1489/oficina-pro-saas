"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { financialTransactions, TransactionType, TransactionStatus, NewFinancialTransaction } from "@/db/schema/finance";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { generateUUID } from "@/lib/server/crypto";
import { logAudit } from "@/lib/server/audit";
import { eq, and } from "drizzle-orm";

export async function createTransactionAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:finance");

    const type = formData.get("type") as TransactionType;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const amountStr = formData.get("amount") as string;
    const dueDateStr = formData.get("dueDate") as string;
    const paymentMethod = (formData.get("paymentMethod") as string) || "PIX";
    const notes = formData.get("notes") as string;

    if (!type || !description || !amountStr || !dueDateStr) {
      return { error: "Tipo, descrição, valor e data de vencimento são obrigatórios." };
    }

    const parsedAmount = parseFloat(amountStr.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return { error: "Informe um valor válido maior que zero." };
    }

    const amountCents = Math.round(parsedAmount * 100);
    const dueDate = new Date(dueDateStr);
    const transactionId = generateUUID();

    const newTransaction: NewFinancialTransaction = {
      id: transactionId,
      companyId,
      type,
      status: "PENDING",
      category: category?.trim() || "Geral",
      description: description.trim(),
      amountCents,
      paidAmountCents: 0,
      dueDate,
      paidAt: null,
      referenceType: "MANUAL",
      referenceId: null,
      customerId: null,
      supplierId: null,
      paymentMethod,
      notes: notes?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(financialTransactions).values(newTransaction);

    await logAudit({
      companyId,
      userId: user.id,
      action: "CREATE",
      entity: "financial_transactions",
      entityId: transactionId,
      newData: { type, description, amountCents, dueDate },
    });

    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao registrar lançamento financeiro." };
  }
}

export async function settleTransactionAction(
  transactionId: string,
  paymentMethod: string,
  paidAmountStr?: string
) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:finance");

    const existing = await db
      .select()
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.id, transactionId),
          eq(financialTransactions.companyId, companyId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { error: "Lançamento financeiro não encontrado." };
    }

    const current = existing[0];

    const paidAmountCents = paidAmountStr
      ? Math.round((parseFloat(paidAmountStr.replace(",", ".")) || 0) * 100)
      : current.amountCents;

    await db
      .update(financialTransactions)
      .set({
        status: "PAID",
        paidAmountCents,
        paymentMethod: paymentMethod || current.paymentMethod || "PIX",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(financialTransactions.id, transactionId),
          eq(financialTransactions.companyId, companyId)
        )
      );

    await logAudit({
      companyId,
      userId: user.id,
      action: "PAYMENT",
      entity: "financial_transactions",
      entityId: transactionId,
      oldData: { status: current.status },
      newData: { status: "PAID", paidAmountCents, paymentMethod },
    });

    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao liquidar lançamento financeiro." };
  }
}

export async function cancelTransactionAction(transactionId: string) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:finance");

    const existing = await db
      .select()
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.id, transactionId),
          eq(financialTransactions.companyId, companyId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { error: "Lançamento não encontrado." };
    }

    const current = existing[0];
    if (current.status === "PAID") {
      return { error: "Lançamentos já quitados não podem ser cancelados diretamente." };
    }

    await db
      .update(financialTransactions)
      .set({
        status: "CANCELED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(financialTransactions.id, transactionId),
          eq(financialTransactions.companyId, companyId)
        )
      );

    await logAudit({
      companyId,
      userId: user.id,
      action: "CANCEL",
      entity: "financial_transactions",
      entityId: transactionId,
      oldData: { status: current.status },
      newData: { status: "CANCELED" },
    });

    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao cancelar lançamento financeiro." };
  }
}
