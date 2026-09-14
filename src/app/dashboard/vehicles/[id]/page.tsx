import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { vehicles } from "@/db/schema/vehicles";
import { customers } from "@/db/schema/customers";
import { workOrders } from "@/db/schema/work_orders";
import { quotes } from "@/db/schema/quotes";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Car, User, Wrench, FileText, ArrowLeft, Gauge, Fuel, Calendar } from "lucide-react";

interface VehicleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { id } = await params;
  const { companyId } = await getTenantContext();

  const vehicleList = await db
    .select({
      id: vehicles.id,
      plate: vehicles.plate,
      brand: vehicles.brand,
      model: vehicles.model,
      year: vehicles.year,
      version: vehicles.version,
      fuelType: vehicles.fuelType,
      mileage: vehicles.mileage,
      notes: vehicles.notes,
      customerId: vehicles.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerWhatsapp: customers.whatsapp,
    })
    .from(vehicles)
    .leftJoin(customers, eq(vehicles.customerId, customers.id))
    .where(and(eq(vehicles.id, id), eq(vehicles.companyId, companyId)))
    .limit(1);

  if (vehicleList.length === 0) {
    notFound();
  }

  const vehicle = vehicleList[0];

  // Buscar histórico de OS e Orçamentos deste veículo
  const [vehicleOrders, vehicleQuotes] = await Promise.all([
    db
      .select()
      .from(workOrders)
      .where(and(eq(workOrders.vehicleId, id), eq(workOrders.companyId, companyId)))
      .orderBy(desc(workOrders.createdAt)),

    db
      .select()
      .from(quotes)
      .where(and(eq(quotes.vehicleId, id), eq(quotes.companyId, companyId)))
      .orderBy(desc(quotes.createdAt)),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/vehicles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Veículos</span>
        </Link>
      </div>

      {/* Header do Veículo */}
      <Card className="bg-gradient-to-br from-white to-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center font-mono shadow-sm">
              <span className="text-[10px] uppercase text-slate-400 font-sans">BRASIL</span>
              <span className="text-sm font-black tracking-wider">{vehicle.plate}</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-xs text-slate-500">
                {vehicle.version || "Versão Padrão"} • {vehicle.year || "Ano N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs bg-slate-100 px-4 py-2 rounded-xl">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-sky-600" />
              <span className="font-bold text-slate-800">
                {vehicle.mileage?.toLocaleString("pt-BR")} km
              </span>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-slate-800">{vehicle.fuelType || "FLEX"}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500">Proprietário:</span>
            <Link
              href={`/dashboard/customers/${vehicle.customerId}`}
              className="font-bold text-sky-600 hover:text-sky-700 underline"
            >
              {vehicle.customerName}
            </Link>
          </div>
        </div>

        {vehicle.notes && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <span className="font-semibold block mb-0.5">Observações:</span>
            <span>{vehicle.notes}</span>
          </div>
        )}
      </Card>

      {/* Histórico Operacional do Veículo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ordens de Serviço */}
        <Card padding="none">
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <CardHeader
              title={`Ordens de Serviço (${vehicleOrders.length})`}
              subtitle="Manutenções e revisões executadas"
              className="mb-0"
            />
          </div>

          {vehicleOrders.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              Nenhuma OS registrada para este veículo.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {vehicleOrders.map((os) => (
                <div key={os.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      OS #{String(os.orderNumber).padStart(4, "0")}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(os.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={os.status} />
                    <span className="font-black text-slate-900">
                      {(os.totalCents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Orçamentos */}
        <Card padding="none">
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <CardHeader
              title={`Orçamentos (${vehicleQuotes.length})`}
              subtitle="Cotações geradas para este veículo"
              className="mb-0"
            />
          </div>

          {vehicleQuotes.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              Nenhum orçamento emitido para este veículo.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {vehicleQuotes.map((q) => (
                <div key={q.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Orçamento #{String(q.quoteNumber).padStart(4, "0")}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(q.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={q.status} />
                    <span className="font-black text-slate-900">
                      {(q.totalCents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
