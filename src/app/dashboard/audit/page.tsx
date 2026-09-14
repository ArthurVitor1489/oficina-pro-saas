import React from "react";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { auditLogs } from "@/db/schema/audit_logs";
import { users } from "@/db/schema/users";
import { eq, desc } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { History, Shield, Clock } from "lucide-react";

export default async function AuditLogsPage() {
  const { companyId } = await requireTenantPermission("view:audit_logs");

  // Buscar logs de auditoria do tenant
  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      oldData: auditLogs.oldData,
      newData: auditLogs.newData,
      ip: auditLogs.ip,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(eq(auditLogs.companyId, companyId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  const actionVariantMap: Record<string, "success" | "danger" | "warning" | "info" | "purple"> = {
    CREATE: "success",
    DELETE: "danger",
    UPDATE: "warning",
    STATUS_CHANGE: "purple",
    LOGIN: "info",
    LOGOUT: "default" as any,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-sky-600" />
          Trilha de Auditoria e Conformidade
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Histórico imutável de operações críticas realizadas nesta oficina.
        </p>
      </div>

      <Card padding="none">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <CardHeader
            title={`Registros de Auditoria (${logs.length})`}
            subtitle="Últimas ações gravadas com identificação de usuário e data"
            className="mb-0"
          />
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhum evento registrado até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4 sm:px-6">Data / Hora</th>
                  <th className="py-3 px-4 sm:px-6">Usuário</th>
                  <th className="py-3 px-4 sm:px-6">Ação</th>
                  <th className="py-3 px-4 sm:px-6">Entidade</th>
                  <th className="py-3 px-4 sm:px-6">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 text-slate-600 font-mono text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-800">
                      {log.userName ? (
                        <div>
                          <span>{log.userName}</span>
                          <span className="block text-[11px] text-slate-400 font-normal">
                            {log.userEmail}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sistema</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <Badge variant={actionVariantMap[log.action] || "default"}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-700 font-semibold uppercase text-xs">
                      {log.entity}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-xs text-slate-500">
                      {log.ip || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
