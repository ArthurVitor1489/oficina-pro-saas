import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { quotes, quoteItems } from "@/db/schema/quotes";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { eq, and } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { ArrowLeft, FileText, User, Car, Calendar, Clock, DollarSign } from "lucide-react";
import { QuoteActionControls } from "./quote-actions";

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;
  const { companyId } = await getTenantContext();

  const quoteList = await db
    .select({
      id: quotes.id,
      quoteNumber: quotes.quoteNumber,
      status: quotes.status,
      validUntil: quotes.validUntil,
      notes: quotes.notes,
      subtotalCents: quotes.subtotalCents,
      discountCents: quotes.discountCents,
      totalCents: quotes.totalCents,
      convertedToWorkOrderId: quotes.convertedToWorkOrderId,
      createdAt: quotes.createdAt,
      customerId: quotes.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerWhatsapp: customers.whatsapp,
      vehicleId: quotes.vehicleId,
      vehiclePlate: vehicles.plate,
      vehicleBrand: vehicles.brand,
      vehicleModel: vehicles.model,
    })
    .from(quotes)
    .leftJoin(customers, eq(quotes.customerId, customers.id))
    .leftJoin(vehicles, eq(quotes.vehicleId, vehicles.id))
    .where(and(eq(quotes.id, id), eq(quotes.companyId, companyId)))
    .limit(1);

  if (quoteList.length === 0) {
    notFound();
  }

  const quote = quoteList[0];

  // Buscar itens do orçamento
  const items = await db
    .select()
    .from(quoteItems)
    .where(and(eq(quoteItems.quoteId, id), eq(quoteItems.companyId, companyId)));

  const totalFormatted = (quote.totalCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/dashboard/quotes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Orçamentos</span>
        </Link>

        <QuoteActionControls
          quoteId={quote.id}
          currentStatus={quote.status}
          convertedToWorkOrderId={quote.convertedToWorkOrderId}
          customerName={quote.customerName || "Cliente"}
          customerPhone={quote.customerWhatsapp || quote.customerPhone}
          quoteNumber={quote.quoteNumber}
          totalFormatted={totalFormatted}
          vehiclePlate={quote.vehiclePlate}
        />
      </div>

      {/* Header do Orçamento */}
      <Card className="bg-gradient-to-br from-white to-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  Orçamento #{String(quote.quoteNumber).padStart(4, "0")}
                </h1>
                <StatusBadge status={quote.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Emitido em: {new Date(quote.createdAt).toLocaleDateString("pt-BR")}
                {quote.validUntil && (
                  <span>
                    {" "}
                    • Válido até: {new Date(quote.validUntil).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block">Valor da Proposta:</span>
            <span className="text-2xl font-black text-slate-900">{totalFormatted}</span>
          </div>
        </div>

        {/* Informações de Cliente e Veículo */}
        <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-sky-600" /> Cliente
            </span>
            <Link
              href={`/dashboard/customers/${quote.customerId}`}
              className="font-bold text-slate-800 text-sm hover:text-sky-600 block"
            >
              {quote.customerName}
            </Link>
            <span className="text-slate-500 mt-0.5 block">
              {quote.customerPhone || "Sem telefone"}
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-sky-600" /> Veículo
            </span>
            {quote.vehiclePlate ? (
              <div>
                <Link
                  href={`/dashboard/vehicles/${quote.vehicleId}`}
                  className="font-bold text-slate-800 text-sm hover:text-sky-600 block"
                >
                  {quote.vehicleBrand} {quote.vehicleModel}
                </Link>
                <span className="font-mono font-bold text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1">
                  {quote.vehiclePlate}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic">Nenhum veículo vinculado</span>
            )}
          </div>
        </div>

        {quote.notes && (
          <div className="mt-4 p-3 bg-slate-100/70 border border-slate-200 rounded-lg text-xs text-slate-700">
            <span className="font-semibold block mb-0.5">Observações da Proposta:</span>
            <span>{quote.notes}</span>
          </div>
        )}
      </Card>

      {/* Itens do Orçamento */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <CardHeader
            title={`Itens da Proposta (${items.length})`}
            subtitle="Detalhamento de mão de obra e autopeças orçadas"
            className="mb-0"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4 sm:px-6">Tipo</th>
                <th className="py-3 px-4 sm:px-6">Descrição</th>
                <th className="py-3 px-4 sm:px-6 text-center">Qtd</th>
                <th className="py-3 px-4 sm:px-6 text-right">Preço Unitário</th>
                <th className="py-3 px-4 sm:px-6 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6">
                    {item.type === "SERVICE" ? (
                      <Badge variant="info">Serviço</Badge>
                    ) : (
                      <Badge variant="success">Peça</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-800">
                    {item.description}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-center font-bold text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right text-slate-600">
                    {(item.unitPriceCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-black text-slate-900">
                    {(item.totalCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totais do Orçamento */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col items-end text-xs space-y-1.5">
          <div className="flex justify-between w-64 text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold">
              {(quote.subtotalCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>

          {quote.discountCents > 0 && (
            <div className="flex justify-between w-64 text-rose-600">
              <span>Desconto:</span>
              <span className="font-semibold">
                -
                {(quote.discountCents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          )}

          <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
            <span>Total da Proposta:</span>
            <span className="text-base text-sky-700">{totalFormatted}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
