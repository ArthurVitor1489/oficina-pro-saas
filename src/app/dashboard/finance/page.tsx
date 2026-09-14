import React from "react";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { financialTransactions } from "@/db/schema/finance";
import { eq, desc, and } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DollarSign, ArrowDownLeft, ArrowUpRight, PlusCircle, Wallet } from "lucide-react";

export default async function FinancePage() {
  const { companyId } = await requireTenantPermission("view:finance");

  const transactions = await db
    .select()
    .from(financialTransactions)
    .where(eq(financialTransactions.companyId, companyId))
    .orderBy(desc(financialTransactions.dueDate))
    .limit(30);

  // Totais
  let totalReceivableCents = 0;
  let totalPayableCents = 0;

  transactions.forEach((t) => {
    if (t.type === "RECEIVABLE" && t.status !== "CANCELED") {
      totalReceivableCents += t.amountCents;
    } else if (t.type === "PAYABLE" && t.status !== "CANCELED") {
      totalPayableCents += t.amountCents;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-sky-600" />
            Gestão Financeira & Fluxo de Caixa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Contas a pagar, contas a receber e conciliação financeira da oficina.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<ArrowUpRight className="w-4 h-4 text-rose-500" />}>
            Nova Despesa
          </Button>
          <Button variant="primary" size="sm" leftIcon={<ArrowDownLeft className="w-4 h-4 text-white" />}>
            Nova Receita
          </Button>
        </div>
      </div>

      {/* Cards Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="sm" className="bg-emerald-50/50 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase">A Receber</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-900">
              {(totalReceivableCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </Card>

        <Card padding="sm" className="bg-rose-50/50 border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase">A Pagar</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-900">
              {(totalPayableCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </Card>

        <Card padding="sm" className="bg-sky-50/50 border-sky-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 uppercase">Saldo Previsto</span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-sky-900">
              {((totalReceivableCents - totalPayableCents) / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <CardHeader
            title="Lançamentos Financeiros"
            subtitle="Histórico de receitas e despesas"
            className="mb-0"
          />
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhuma transação financeira registrada no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4 sm:px-6">Vencimento</th>
                  <th className="py-3 px-4 sm:px-6">Tipo</th>
                  <th className="py-3 px-4 sm:px-6">Descrição / Categoria</th>
                  <th className="py-3 px-4 sm:px-6">Status</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 text-slate-600 font-mono text-xs">
                      {new Date(t.dueDate).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      {t.type === "RECEIVABLE" ? (
                        <Badge variant="success">Receita</Badge>
                      ) : (
                        <Badge variant="danger">Despesa</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <p className="font-semibold text-slate-900">{t.description}</p>
                      <p className="text-[11px] text-slate-400">{t.category}</p>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <StatusBadge status={t.status} />
                    </td>
                    <td
                      className={`py-3.5 px-4 sm:px-6 text-right font-black ${
                        t.type === "RECEIVABLE" ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {(t.amountCents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
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
