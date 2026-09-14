import { db } from "@/db";
import { auditLogs, NewAuditLog } from "@/db/schema/audit_logs";
import { generateUUID } from "./crypto";

export interface LogAuditParams {
  companyId: string;
  userId?: string | null;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "STATUS_CHANGE"
    | "LOGIN"
    | "LOGOUT"
    | "STOCK_MOVE"
    | "PERMISSION_CHANGE"
    | "PAYMENT";
  entity: string; // companies, users, customers, vehicles, work_orders, quotes, products, finance
  entityId?: string | null;
  oldData?: any;
  newData?: any;
  ip?: string | null;
  userAgent?: string | null;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const entry: NewAuditLog = {
      id: generateUUID(),
      companyId: params.companyId,
      userId: params.userId || null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || null,
      oldData: params.oldData ? JSON.stringify(params.oldData) : null,
      newData: params.newData ? JSON.stringify(params.newData) : null,
      ip: params.ip || null,
      userAgent: params.userAgent || null,
      createdAt: new Date(),
    };

    await db.insert(auditLogs).values(entry);
  } catch (error) {
    // Log de auditoria não deve quebrar a transação principal em caso de falha silenciosa,
    // mas deve ser exibido no console do servidor para monitoramento
    console.error("CRITICAL: Failed to write audit log:", error);
  }
}
