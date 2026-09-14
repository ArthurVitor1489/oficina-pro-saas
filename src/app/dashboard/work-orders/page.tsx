import React from "react";
import Link from "next/link";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { workOrders } from "@/db/schema/work_orders";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { users } from "@/db/schema/users";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Wrench, Calendar, User, Car, ArrowRight } from "lucide-react";
import { WorkOrderModal } from "./work-order-modal";

export default async function WorkOrdersPage() {
  const { companyId } = await getTenantContext();

  const [ordersList, customersList, vehiclesList, techniciansList] = await Promise.all([
    db
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
        assignedUserName: users.name,
      })
      .from(workOrders)
      .leftJoin(customers, eq(workOrders.customerId, customers.id))
      .leftJoin(vehicles, eq(workOrders.vehicleId, vehicles.id))
      .leftJoin(users, eq(workOrders.assignedUserId, users.id))
      .where(eq(workOrders.companyId, companyId))
      .orderBy(desc(workOrders.createdAt)),

    db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(eq(customers.companyId, companyId)),

    db
      .select({
        id: vehicles.id,
        customerId: vehicles.customerId,
        plate: vehicles.plate,
        model: vehicles.model,
      })
      .from(vehicles)
      .where(eq(vehicles.companyId, companyId)),

    db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(eq(users.companyId, companyId)),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-sky-600" />
            Ordens de Serviço ({ordersList.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Fluxo operacional do pátio, serviços em execução, peças e entrega ao cliente.
          </p>
        </div>

        <WorkOrderModal
          customers={customersList}
          vehicles={vehiclesList}
          technicians={techniciansList}
        />
      </div>

      {ordersList.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhuma OS em aberto</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Abra uma nova Ordem de Serviço ou converta um orçamento aprovado para iniciar os trabalhos no pátio.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordersList.map((os) => (
            <Card key={os.id} className="hover:border-sky-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <Link
                    href={`/dashboard/work-orders/${os.id}`}
                    className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors"
                  >
                    OS #{String(os.orderNumber).padStart(4, "0")}
                  </Link>
                  <StatusBadge status={os.status} />
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{os.customerName}</span>
                  </div>
                  {os.vehiclePlate && (
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {os.vehiclePlate} • {os.vehicleModel}
                      </span>
                    </div>
                  )}
                  {os.assignedUserName && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Wrench className="w-3.5 h-3.5 text-sky-500" />
                      <span>Técnico: {os.assignedUserName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(os.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total:</span>
                  <span className="text-sm font-black text-slate-900">
                    {(os.totalCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>

                <Link
                  href={`/dashboard/work-orders/${os.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  <span>Abrir OS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
