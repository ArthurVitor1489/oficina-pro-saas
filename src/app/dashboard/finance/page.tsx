import React from "react";
import Link from "next/link";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { financialTransactions } from "@/db/schema/finance";
import { eq, desc, and } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { DollarSign, ArrowDownLeft, ArrowUpRight, Wallet, Filter } from "lucide-react";
import { TransactionModal } from "./transaction-modal";
import { TransactionRowActions } from "./transaction-row-actions";

interface FinancePageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
  }>;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const { companyId } = await requireTenantPermission("view:finance");
  const resolvedSearchParams = await searchParams;
  const filterType = resolvedSearchParams.type;
  const filterStatus = resolvedSearchParams.status;

  const allTransactions = await db
    .select()
    .from(financialTransactions)
    .where(eq(financialTransactions.companyId, companyId))
    .orderBy(desc(financialTransactions.dueDate))
    .limit(100);

  // Totais globais da empresa
  let totalReceivableCents = 0;
  let totalPayableCents = 0;
  let pendingReceivableCents = 0;
  let pendingPayableCents = 0;

  allTransactions.forEach((t) => {
    if (t.status !== "CANCELED") {
      if (t.type === "RECEIVABLE") {
        totalReceivableCents += t.amountCents;
        if (t.status === "PENDING" || t.status === "OVERDUE") {
          pendingReceivableCents += t.amountCents;
        }
      } else if (t.type === "PAYABLE") {
        totalPayableCents += t.amountCents;
        if (t.status === "PENDING" || t.status === "OVERDUE") {
          pendingPayableCents += t.amountCents;
        }
      }
    }
  });

  // Filtragem
  const filteredTransactions = allTransactions.filter((t) => {
    if (filterType && t.type !== filterType) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
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

        <TransactionModal />
      </div>

      {/* Indicadores Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="sm" className="bg-emerald-50/50 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">A Receber Pendente</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-900">
              {(pendingReceivableCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700">
            Total histórico: {(totalReceivableCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </Card>

        <Card padding="sm" className="bg-rose-50/50 border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">A Pagar Pendente</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-900">
              {(pendingPayableCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-rose-700">
            Total histórico: {(totalPayableCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </Card>

        <Card padding="sm" className="bg-sky-50/50 border-sky-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Saldo Líquido Previsto</span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-sky-900">
              {((pendingReceivableCents - pendingPayableCents) / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-sky-700">
            Recebíveis pendentes menos contas a pagar
          </div>
        </Card>
      </div>

      {/* Filtros e Tabela */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <CardHeader
            title="Lançamentos Financeiros"
            subtitle={`Exibindo ${filteredTransactions.length} títulos`}
            className="mb-0"
          />

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtros:
            </span>
            <Link
              href="/dashboard/finance"
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                !filterType && !filterStatus
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos
            </Link>
            <Link
              href="/dashboard/finance?type=RECEIVABLE"
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterType === "RECEIVABLE"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Receitas
            </Link>
            <Link
              href="/dashboard/finance?type=PAYABLE"
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterType === "PAYABLE"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Despesas
            </Link>
            <Link
              href="/dashboard/finance?status=PENDING"
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterStatus === "PENDING"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Pendentes
            </Link>
            <Link
              href="/dashboard/finance?status=PAID"
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterStatus === "PAID"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Quitados
            </Link>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhum lançamento financeiro encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4 sm:px-6">Vencimento</th>
                  <th className="py-3 px-4 sm:px-6">Tipo</th>
                  <th className="py-3 px-4 sm:px-6">Descrição / Categoria</th>
                  <th className="py-3 px-4 sm:px-6">Forma</th>
                  <th className="py-3 px-4 sm:px-6">Status</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Valor</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 text-slate-600 font-mono text-xs">
                      <div>{new Date(t.dueDate).toLocaleDateString("pt-BR")}</div>
                      {t.paidAt && (
                        <div className="text-[10px] text-emerald-600">
                          Pago: {new Date(t.paidAt).toLocaleDateString("pt-BR")}
                        </div>
                      )}
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
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span>{t.category}</span>
                        {t.referenceType !== "MANUAL" && (
                          <span className="text-[10px] bg-slate-100 px-1 py-0.2 rounded text-slate-500">
                            Ref: {t.referenceType}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-600 text-xs">
                      {t.paymentMethod || "Não informado"}
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
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <TransactionRowActions
                        transaction={{
                          id: t.id,
                          description: t.description,
                          type: t.type,
                          status: t.status,
                          amountCents: t.amountCents,
                          paymentMethod: t.paymentMethod,
                        }}
                      />
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
