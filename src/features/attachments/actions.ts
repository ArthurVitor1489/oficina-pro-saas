"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { attachments, AttachmentEntityType, NewAttachment } from "@/db/schema/attachments";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { generateUUID } from "@/lib/server/crypto";
import { logAudit } from "@/lib/server/audit";
import { eq, and, desc } from "drizzle-orm";

export async function uploadAttachmentAction(formData: FormData) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:work_orders");

    const entityType = formData.get("entityType") as AttachmentEntityType;
    const entityId = formData.get("entityId") as string;
    const file = formData.get("file") as File;

    if (!entityType || !entityId || !file || file.size === 0) {
      return { error: "Arquivo, tipo de entidade e ID são obrigatórios." };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { error: "O tamanho do arquivo não pode exceder 10MB." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "application/octet-stream";
    const storageKey = `data:${mimeType};base64,${base64Data}`;

    const attachmentId = generateUUID();

    const newAttachment: NewAttachment = {
      id: attachmentId,
      companyId,
      entityType,
      entityId,
      fileName: file.name,
      fileType: mimeType,
      fileSize: file.size,
      storageKey,
      uploadedBy: user.id,
      createdAt: new Date(),
    };

    await db.insert(attachments).values(newAttachment);

    await logAudit({
      companyId,
      userId: user.id,
      action: "UPLOAD_FILE",
      entity: "attachments",
      entityId: attachmentId,
      newData: { entityType, entityId, fileName: file.name, fileSize: file.size },
    });

    revalidatePath(`/dashboard/work-orders/${entityId}`);
    revalidatePath(`/dashboard/vehicles/${entityId}`);
    revalidatePath(`/dashboard/purchases/${entityId}`);
    return { success: true, attachmentId };
  } catch (err: any) {
    return { error: err.message || "Erro ao salvar anexo." };
  }
}

export async function deleteAttachmentAction(attachmentId: string) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:work_orders");

    const existing = await db
      .select()
      .from(attachments)
      .where(and(eq(attachments.id, attachmentId), eq(attachments.companyId, companyId)))
      .limit(1);

    if (existing.length === 0) {
      return { error: "Anexo não encontrado." };
    }

    const item = existing[0];

    await db
      .delete(attachments)
      .where(and(eq(attachments.id, attachmentId), eq(attachments.companyId, companyId)));

    await logAudit({
      companyId,
      userId: user.id,
      action: "DELETE",
      entity: "attachments",
      entityId: attachmentId,
      oldData: { fileName: item.fileName, entityType: item.entityType, entityId: item.entityId },
    });

    revalidatePath(`/dashboard/work-orders/${item.entityId}`);
    revalidatePath(`/dashboard/vehicles/${item.entityId}`);
    revalidatePath(`/dashboard/purchases/${item.entityId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao excluir anexo." };
  }
}

export async function getEntityAttachments(entityType: AttachmentEntityType, entityId: string) {
  const { companyId } = await requireTenantPermission("view:work_orders");

  return await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.companyId, companyId),
        eq(attachments.entityType, entityType),
        eq(attachments.entityId, entityId)
      )
    )
    .orderBy(desc(attachments.createdAt));
}
