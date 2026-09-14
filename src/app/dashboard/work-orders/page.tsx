import React from "react";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { workOrders } from "@/db/schema/work_orders";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { eq, desc } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Wrench, PlusCircle, Calendar, User, Car } from "lucide-react";

export default async function WorkOrdersPage() {
  const { companyId, user } = await getTenantContext();

  const orders = await db
    .select({
      id: workOrders.id,
      orderNumber: workOrders.orderNumber,
      status: workOrders.status,
      notes: workOrders.notes,
      totalCents: workOrders.totalCents,
      createdAt: workOrders.createdAt,
      customerName: customers.name,
      vehiclePlate: vehicles.plate,
      vehicleModel: vehicles.model,
    })
    .from(workOrders)
    .leftJoin(customers, eq(workOrders.customerId, customers.id))
    .leftJoin(vehicles, eq(workOrders.vehicleId, vehicles.id))
    .where(eq(workOrders.companyId, companyId))
    .orderBy(desc(workOrders.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-sky-600" />
            Ordens de Serviço (OS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Fluxo operacional, execução de serviços, peças aplicadas e status da oficina.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Nova Ordem de Serviço
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhuma OS aberta</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Abra uma nova Ordem de Serviço ou converta um orçamento aprovado para iniciar os trabalhos no pátio.
          </p>
          <Button variant="primary" size="sm">
            Criar Primeira OS
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((os) => (
            <Card key={os.id} className="hover:border-sky-300 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">
                  OS #{String(os.orderNumber).padStart(4, "0")}
                </span>
                <StatusBadge status={os.status} />
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">{os.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {os.vehiclePlate} • {os.vehicleModel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(os.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Valor Total:</span>
                <span className="text-sm font-black text-slate-900">
                  {(os.totalCents / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
