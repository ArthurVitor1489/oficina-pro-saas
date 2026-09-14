import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { companies } from "./companies";
import { customers } from "./customers";
import { suppliers } from "./suppliers";

export type TransactionType = "RECEIVABLE" | "PAYABLE";
export type TransactionStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELED";

export const financialTransactions = sqliteTable(
  "financial_transactions",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    type: text("type").$type<TransactionType>().notNull(), // RECEIVABLE (a receber) / PAYABLE (a pagar)
    status: text("status").$type<TransactionStatus>().notNull().default("PENDING"),
    category: text("category").notNull(), // Serviços, Peças, Fornecedor, Aluguel, Folha, etc.
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull().default(0), // Valor nominal
    paidAmountCents: integer("paid_amount_cents").default(0), // Valor efetivamente pago/recebido
    dueDate: integer("due_date", { mode: "timestamp_ms" }).notNull(), // Data de vencimento
    paidAt: integer("paid_at", { mode: "timestamp_ms" }), // Data de liquidação
    referenceType: text("reference_type"), // WORK_ORDER, PURCHASE, MANUAL
    referenceId: text("reference_id"), // ID da OS ou Compra
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    supplierId: text("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    paymentMethod: text("payment_method"), // PIX, DINHEIRO, CARTAO_CREDITO, CARTAO_DEBITO, BOLETO
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_fin_company_id").on(table.companyId),
    index("idx_fin_type").on(table.type),
    index("idx_fin_status").on(table.status),
    index("idx_fin_due_date").on(table.dueDate),
    index("idx_fin_ref").on(table.referenceType, table.referenceId),
  ]
);

export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type NewFinancialTransaction = typeof financialTransactions.$inferInsert;
