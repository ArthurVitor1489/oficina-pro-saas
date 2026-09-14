import React from "react";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { quotes } from "@/db/schema/quotes";
import { customers } from "@/db/schema/customers";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FileText, PlusCircle } from "lucide-react";

export default async function QuotesPage() {
  const { companyId } = await getTenantContext();

  const quotesList = await db
    .select({
      id: quotes.id,
      quoteNumber: quotes.quoteNumber,
      status: quotes.status,
      totalCents: quotes.totalCents,
      createdAt: quotes.createdAt,
      customerName: customers.name,
    })
    .from(quotes)
    .leftJoin(customers, eq(quotes.customerId, customers.id))
    .where(eq(quotes.companyId, companyId))
    .orderBy(desc(quotes.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-600" />
            Orçamentos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cotações de peças e serviços para aprovação de clientes com envio rápido.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
          Novo Orçamento
        </Button>
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
          <Button variant="primary" size="sm">
            Criar Orçamento
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotesList.map((q) => (
            <Card key={q.id}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">
                  Orçamento #{String(q.quoteNumber).padStart(4, "0")}
                </span>
                <StatusBadge status={q.status} />
              </div>
              <div className="mt-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">{q.customerName}</p>
                <p className="text-slate-400 mt-0.5">
                  {new Date(q.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Total:</span>
                <span className="text-sm font-black text-slate-900">
                  {(q.totalCents / 100).toLocaleString("pt-BR", {
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
