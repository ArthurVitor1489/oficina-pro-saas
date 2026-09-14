import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { companies } from "./companies";
import { customers } from "./customers";
import { vehicles } from "./vehicles";
import { users } from "./users";
import { services } from "./services";
import { products } from "./products";

export type WorkOrderStatus =
  | "OPEN"
  | "APPROVED"
  | "IN_PROGRESS"
  | "WAITING_PART"
  | "FINISHED"
  | "DELIVERED"
  | "CANCELED";

export const workOrders = sqliteTable(
  "work_orders",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    orderNumber: integer("order_number").notNull(), // Número sequencial da OS por empresa
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    vehicleId: text("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    assignedUserId: text("assigned_user_id").references(() => users.id, { onDelete: "set null" }), // Mecânico responsável
    status: text("status").$type<WorkOrderStatus>().notNull().default("OPEN"),
    notes: text("notes"), // Observações / Sintomas relatados
    internalNotes: text("internal_notes"), // Diagnóstico técnico interno
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
    deliveredAt: integer("delivered_at", { mode: "timestamp_ms" }),
    fromQuoteId: text("from_quote_id"), // Se veio de um orçamento aprovado
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_wo_company_id").on(table.companyId),
    index("idx_wo_customer_id").on(table.customerId),
    index("idx_wo_vehicle_id").on(table.vehicleId),
    index("idx_wo_assigned_user").on(table.assignedUserId),
    index("idx_wo_status").on(table.status),
    index("idx_wo_number").on(table.companyId, table.orderNumber),
  ]
);

export const workOrderItems = sqliteTable(
  "work_order_items",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    workOrderId: text("work_order_id")
      .notNull()
      .references(() => workOrders.id, { onDelete: "cascade" }),
    type: text("type").$type<"SERVICE" | "PRODUCT">().notNull(),
    serviceId: text("service_id").references(() => services.id, { onDelete: "set null" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    assignedUserId: text("assigned_user_id").references(() => users.id, { onDelete: "set null" }), // Quem realizou o item
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [
    index("idx_wo_items_order_id").on(table.workOrderId),
    index("idx_wo_items_company_id").on(table.companyId),
  ]
);

export type WorkOrder = typeof workOrders.$inferSelect;
export type NewWorkOrder = typeof workOrders.$inferInsert;
export type WorkOrderItem = typeof workOrderItems.$inferSelect;
export type NewWorkOrderItem = typeof workOrderItems.$inferInsert;
