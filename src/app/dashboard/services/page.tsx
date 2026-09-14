import React from "react";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { services } from "@/db/schema/services";
import { eq } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Settings, PlusCircle, Clock } from "lucide-react";

export default async function ServicesPage() {
  const { companyId } = await getTenantContext();

  const servicesList = await db
    .select()
    .from(services)
    .where(eq(services.companyId, companyId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-sky-600" />
            Catálogo de Serviços da Oficina
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tabela padronizada de mão de obra e tempos estimados para cotações.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
          Novo Serviço
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servicesList.map((svc) => (
          <Card key={svc.id} className="hover:border-sky-300 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block mb-1">
                  {svc.category || "Geral"}
                </span>
                <h3 className="text-base font-bold text-slate-900">{svc.name}</h3>
              </div>
            </div>

            {svc.description && (
              <p className="mt-2 text-xs text-slate-500 line-clamp-2">{svc.description}</p>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{svc.estimatedMinutes} min</span>
              </div>
              <span className="text-sm font-black text-slate-900">
                {(svc.basePriceCents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
