import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { companies } from "./companies";
import { users } from "./users";

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(), // CREATE, UPDATE, DELETE, STATUS_CHANGE, LOGIN, LOGOUT, STOCK_MOVE, PERMISSION_CHANGE
    entity: text("entity").notNull(), // companies, users, customers, vehicles, quotes, work_orders, products, finance
    entityId: text("entity_id"),
    oldData: text("old_data"), // JSON
    newData: text("new_data"), // JSON
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_audit_company_id").on(table.companyId),
    index("idx_audit_user_id").on(table.userId),
    index("idx_audit_entity").on(table.entity),
    index("idx_audit_action").on(table.action),
    index("idx_audit_created_at").on(table.createdAt),
  ]
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
