import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { companies } from "./companies";

export const services = sqliteTable(
  "services",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // Ex: Troca de óleo, Alinhamento, etc.
    description: text("description"),
    category: text("category"), // Mecânica, Elétrica, Suspensão, etc.
    basePriceCents: integer("base_price_cents").notNull().default(0), // Valor base em centavos
    estimatedMinutes: integer("estimated_minutes").default(60), // Duração estimada em minutos
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_services_company_id").on(table.companyId),
    index("idx_services_name").on(table.name),
    index("idx_services_category").on(table.category),
  ]
);

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
