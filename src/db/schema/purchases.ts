import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { companies } from "./companies";
import { suppliers } from "./suppliers";
import { products } from "./products";

export type PurchaseStatus = "DRAFT" | "CONFIRMED" | "CANCELED";

export const purchases = sqliteTable(
  "purchases",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    purchaseNumber: integer("purchase_number").notNull(), // Sequencial por oficina
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    invoiceNumber: text("invoice_number"), // Número da NF
    status: text("status").$type<PurchaseStatus>().notNull().default("DRAFT"),
    purchaseDate: integer("purchase_date", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    freightCents: integer("freight_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    paymentTerms: text("payment_terms"), // À vista, 30/60 dias, etc.
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_purchases_company_id").on(table.companyId),
    index("idx_purchases_supplier_id").on(table.supplierId),
    index("idx_purchases_invoice").on(table.invoiceNumber),
  ]
);

export const purchaseItems = sqliteTable(
  "purchase_items",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    purchaseId: text("purchase_id")
      .notNull()
      .references(() => purchases.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    unitCostCents: integer("unit_cost_cents").notNull().default(0),
    totalCostCents: integer("total_cost_cents").notNull().default(0),
  },
  (table) => [
    index("idx_purchase_items_purchase_id").on(table.purchaseId),
    index("idx_purchase_items_product_id").on(table.productId),
    index("idx_purchase_items_company_id").on(table.companyId),
  ]
);

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type NewPurchaseItem = typeof purchaseItems.$inferInsert;
