import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { companies } from "./companies";

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    skuCode: text("sku_code"), // Código interno ou de barras
    manufacturer: text("manufacturer"), // Bosch, Cofap, Mahle, Mobil, etc.
    category: text("category"), // Filtros, Freios, Suspensão, Óleos, etc.
    unit: text("unit").notNull().default("UN"), // UN, L, KG, PAR, KIT
    costPriceCents: integer("cost_price_cents").notNull().default(0), // Custo em centavos
    salePriceCents: integer("sale_price_cents").notNull().default(0), // Preço de venda em centavos
    stockQuantity: integer("stock_quantity").notNull().default(0), // Saldo atual em estoque
    minStock: integer("min_stock").notNull().default(0), // Estoque mínimo para alertas
    location: text("location"), // Localização física na oficina (Ex: Prateleira B3)
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_products_company_id").on(table.companyId),
    index("idx_products_sku_code").on(table.skuCode),
    index("idx_products_name").on(table.name),
    index("idx_products_category").on(table.category),
  ]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
