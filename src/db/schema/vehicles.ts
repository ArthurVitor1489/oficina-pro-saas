import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { companies } from "./companies";
import { customers } from "./customers";

export const vehicles = sqliteTable(
  "vehicles",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    plate: text("plate").notNull(), // Ex: ABC-1234 ou BRA2E19
    brand: text("brand").notNull(), // Marca
    model: text("model").notNull(), // Modelo
    year: integer("year"),
    version: text("version"),
    fuelType: text("fuel_type"), // FLEX, GASOLINA, ETANOL, DIESEL, ELETRICO, HIBRIDO
    mileage: integer("mileage").default(0), // Quilometragem atual em KM
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_vehicles_company_id").on(table.companyId),
    index("idx_vehicles_customer_id").on(table.customerId),
    index("idx_vehicles_plate").on(table.plate),
  ]
);

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
