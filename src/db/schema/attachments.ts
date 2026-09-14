import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { companies } from "./companies";
import { users } from "./users";

export type AttachmentEntityType =
  | "CUSTOMER"
  | "VEHICLE"
  | "QUOTE"
  | "WORK_ORDER"
  | "PURCHASE"
  | "SUPPLIER"
  | "PRODUCT"
  | "NFE_XML";

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey(), // UUID
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    entityType: text("entity_type").$type<AttachmentEntityType>().notNull(),
    entityId: text("entity_id").notNull(),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(), // MIME type
    fileSize: integer("file_size").notNull(), // Em bytes
    storageKey: text("storage_key").notNull(), // Identificador no Storage S3/R2/Blob
    uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_attachments_company_id").on(table.companyId),
    index("idx_attachments_entity").on(table.entityType, table.entityId),
  ]
);

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
