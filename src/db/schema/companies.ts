import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export type CompanyPlan = "STARTER" | "PRO" | "PREMIUM";
export type CompanyStatus = "ACTIVE" | "SUSPENDED" | "CANCELED";

export const companies = sqliteTable(
  "companies",
  {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull(), // Razão social
    tradeName: text("trade_name"), // Nome fantasia
    document: text("document").notNull(), // CNPJ / CPF
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    zipCode: text("zip_code"),
    logoUrl: text("logo_url"),
    plan: text("plan").$type<CompanyPlan>().notNull().default("STARTER"),
    status: text("status").$type<CompanyStatus>().notNull().default("ACTIVE"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_companies_document").on(table.document),
    index("idx_companies_status").on(table.status),
  ]
);

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
