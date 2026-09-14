import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { workOrders } from "@/db/schema/work_orders";
import { quotes } from "@/db/schema/quotes";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Car,
  Wrench,
  FileText,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  ArrowLeft,
  PlusCircle,
  Calendar,
} from "lucide-react";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const { companyId } = await getTenantContext();

  // Buscar cliente garantindo o tenant
  const customerList = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.companyId, companyId)))
    .limit(1);

  if (customerList.length === 0) {
    notFound();
  }

  const customer = customerList[0];

  // Buscar veículos, OS e orçamentos do cliente neste tenant
  const [customerVehicles, customerWorkOrders, customerQuotes] = await Promise.all([
    db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.customerId, id), eq(vehicles.companyId, companyId))),

    db
      .select()
      .from(workOrders)
      .where(and(eq(workOrders.customerId, id), eq(workOrders.companyId, companyId)))
      .orderBy(desc(workOrders.createdAt)),

    db
      .select()
      .from(quotes)
      .where(and(eq(quotes.customerId, id), eq(quotes.companyId, companyId)))
      .orderBy(desc(quotes.createdAt)),
  ]);

  const cleanPhone = (customer.whatsapp || customer.phone)?.replace(/\D/g, "");

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Clientes</span>
        </Link>
      </div>

      {/* Customer Header Profile Card */}
      <Card className="border-sky-100 bg-gradient-to-br from-white to-sky-50/20">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">{customer.name}</h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                CPF/CNPJ: {customer.document || "Não informado"}
              </p>
              {customer.city && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {customer.address ? `${customer.address}, ` : ""}
                    {customer.city} - {customer.state || "UF"}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {cleanPhone && (
              <a
                href={`https://wa.me/55${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Ligar</span>
              </a>
            )}
          </div>
        </div>

        {customer.notes && (
          <div className="mt-4 p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs text-amber-900">
            <span className="font-semibold block mb-0.5">Observações:</span>
            <span>{customer.notes}</span>
          </div>
        )}
      </Card>

      {/* Grid: Veículos do Cliente + Resumo Operacional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Veículos Cadastrados */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader
              title={`Veículos (${customerVehicles.length})`}
              subtitle="Frota registrada deste cliente"
            />

            {customerVehicles.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>Nenhum veículo vinculado.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {customerVehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs px-2 py-0.5 bg-slate-900 text-white rounded">
                        {v.plate}
                      </span>
                      <span className="text-[11px] text-slate-500">{v.year || "Ano N/A"}</span>
                    </div>
                    <p className="font-bold text-sm text-slate-800 mt-1.5">
                      {v.brand} {v.model}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {v.mileage?.toLocaleString("pt-BR")} km • {v.fuelType || "FLEX"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Histórico de OS e Orçamentos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ordens de Serviço */}
          <Card padding="none">
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <CardHeader
                title={`Ordens de Serviço (${customerWorkOrders.length})`}
                subtitle="Histórico de manutenções realizadas"
                className="mb-0"
              />
            </div>

            {customerWorkOrders.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Nenhuma OS registrada para este cliente.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {customerWorkOrders.map((os) => (
                  <div
                    key={os.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">
                        OS #{String(os.orderNumber).padStart(4, "0")}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(os.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={os.status} />
                      <span className="font-black text-slate-900 text-sm">
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
                title={`Orçamentos (${customerQuotes.length})`}
                subtitle="Cotações enviadas ao cliente"
                className="mb-0"
              />
            </div>

            {customerQuotes.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Nenhum orçamento emitido para este cliente.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {customerQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Orçamento #{String(q.quoteNumber).padStart(4, "0")}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(q.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={q.status} />
                      <span className="font-black text-slate-900 text-sm">
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
    </div>
  );
}
