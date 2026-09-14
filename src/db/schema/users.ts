import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { companies } from "./companies";

export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "ATTENDANT" | "MECHANIC" | "FINANCE";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<UserRole>().notNull().default("MECHANIC"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("idx_users_email").on(table.email),
    index("idx_users_company_id").on(table.companyId),
    index("idx_users_role").on(table.role),
  ]
);

export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, "passwordHash">;
export type NewUser = typeof users.$inferInsert;
