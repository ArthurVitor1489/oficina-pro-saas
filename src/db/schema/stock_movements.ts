import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { companies } from "./companies";
import { products } from "./products";
import { users } from "./users";

export type StockMovementType =
  | "PURCHASE"
  | "SALE"
  | "WORK_ORDER"
  | "ADJUSTMENT"
  | "RETURN"
  | "TRANSFER";

export const stockMovements = sqliteTable(
  "stock_movements",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    type: text("type").$type<StockMovementType>().notNull(),
    quantity: integer("quantity").notNull(), // Quantidade movimentada (+ entrada, - saída)
    unitCostCents: integer("unit_cost_cents").default(0),
    referenceType: text("reference_type"), // PURCHASE, WORK_ORDER, MANUAL
    referenceId: text("reference_id"), // ID da compra ou da OS
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }), // Quem realizou
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_stock_company_id").on(table.companyId),
    index("idx_stock_product_id").on(table.productId),
    index("idx_stock_type").on(table.type),
    index("idx_stock_created_at").on(table.createdAt),
  ]
);

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
