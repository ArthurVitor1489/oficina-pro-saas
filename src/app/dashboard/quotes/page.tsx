import React from "react";
import Link from "next/link";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { quotes } from "@/db/schema/quotes";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { services } from "@/db/schema/services";
import { products } from "@/db/schema/products";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { FileText, ArrowRight } from "lucide-react";
import { QuoteModal } from "./quote-modal";

export default async function QuotesPage() {
  const { companyId } = await getTenantContext();

  const [quotesList, customersList, vehiclesList, servicesList, productsList] = await Promise.all([
    db
      .select({
        id: quotes.id,
        quoteNumber: quotes.quoteNumber,
        status: quotes.status,
        totalCents: quotes.totalCents,
        createdAt: quotes.createdAt,
        customerName: customers.name,
        vehiclePlate: vehicles.plate,
        vehicleModel: vehicles.model,
      })
      .from(quotes)
      .leftJoin(customers, eq(quotes.customerId, customers.id))
      .leftJoin(vehicles, eq(quotes.vehicleId, vehicles.id))
      .where(eq(quotes.companyId, companyId))
      .orderBy(desc(quotes.createdAt)),

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
      .select({
        id: services.id,
        name: services.name,
        basePriceCents: services.basePriceCents,
      })
      .from(services)
      .where(eq(services.companyId, companyId)),

    db
      .select({
        id: products.id,
        name: products.name,
        salePriceCents: products.salePriceCents,
        stockQuantity: products.stockQuantity,
        unit: products.unit,
      })
      .from(products)
      .where(eq(products.companyId, companyId)),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-600" />
            Orçamentos ({quotesList.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Propostas de peças e serviços para aprovação e conversão em Ordens de Serviço.
          </p>
        </div>

        <QuoteModal
          customers={customersList}
          vehicles={vehiclesList}
          services={servicesList}
          products={productsList}
        />
      </div>

      {quotesList.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhum orçamento cadastrado</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Gere propostas para seus clientes com cálculo automático de peças e mão de obra.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotesList.map((q) => (
            <Card key={q.id} className="hover:border-sky-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <Link
                    href={`/dashboard/quotes/${q.id}`}
                    className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors"
                  >
                    Orçamento #{String(q.quoteNumber).padStart(4, "0")}
                  </Link>
                  <StatusBadge status={q.status} />
                </div>

                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">{q.customerName}</p>
                  {q.vehiclePlate && (
                    <p className="text-slate-500 font-mono">
                      🚗 {q.vehiclePlate} ({q.vehicleModel})
                    </p>
                  )}
                  <p className="text-slate-400 text-[11px] pt-1">
                    Emitido em: {new Date(q.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total:</span>
                  <span className="text-sm font-black text-slate-900">
                    {(q.totalCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>

                <Link
                  href={`/dashboard/quotes/${q.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  <span>Ver Detalhes</span>
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
