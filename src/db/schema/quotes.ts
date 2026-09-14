import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { companies } from "./companies";
import { customers } from "./customers";
import { vehicles } from "./vehicles";
import { services } from "./services";
import { products } from "./products";

export type QuoteStatus =
  | "DRAFT"
  | "SENT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CONVERTED";

export const quotes = sqliteTable(
  "quotes",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    quoteNumber: integer("quote_number").notNull(), // Número sequencial por empresa
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    vehicleId: text("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    status: text("status").$type<QuoteStatus>().notNull().default("DRAFT"),
    validUntil: integer("valid_until", { mode: "timestamp_ms" }),
    notes: text("notes"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    convertedToWorkOrderId: text("converted_to_work_order_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_quotes_company_id").on(table.companyId),
    index("idx_quotes_customer_id").on(table.customerId),
    index("idx_quotes_vehicle_id").on(table.vehicleId),
    index("idx_quotes_status").on(table.status),
    index("idx_quotes_number").on(table.companyId, table.quoteNumber),
  ]
);

export type ItemType = "SERVICE" | "PRODUCT";

export const quoteItems = sqliteTable(
  "quote_items",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    type: text("type").$type<ItemType>().notNull(),
    serviceId: text("service_id").references(() => services.id, { onDelete: "set null" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
  },
  (table) => [
    index("idx_quote_items_quote_id").on(table.quoteId),
    index("idx_quote_items_company_id").on(table.companyId),
  ]
);

export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type NewQuoteItem = typeof quoteItems.$inferInsert;
