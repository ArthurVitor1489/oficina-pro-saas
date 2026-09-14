import React from "react";
import Link from "next/link";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { workOrders } from "@/db/schema/work_orders";
import { financialTransactions } from "@/db/schema/finance";
import { purchases } from "@/db/schema/purchases";
import { products } from "@/db/schema/products";
import { eq, and, desc, sql } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function ReportsPage() {
  const { companyId, company } = await requireTenantPermission("view:finance");

  // Consultas agregadas do tenant
  const [allTransactions, completedOrders, confirmedPurchases] = await Promise.all([
    db
      .select()
      .from(financialTransactions)
      .where(and(eq(financialTransactions.companyId, companyId), eq(financialTransactions.status, "PAID"))),

    db
      .select({
        id: workOrders.id,
        orderNumber: workOrders.orderNumber,
        totalCents: workOrders.totalCents,
        finishedAt: workOrders.finishedAt,
        deliveredAt: workOrders.deliveredAt,
      })
      .from(workOrders)
      .where(
        and(
          eq(workOrders.companyId, companyId),
          sql`${workOrders.status} IN ('FINISHED', 'DELIVERED')`
        )
      ),

    db
      .select({
        id: purchases.id,
        totalCents: purchases.totalCents,
        purchaseDate: purchases.purchaseDate,
      })
      .from(purchases)
      .where(and(eq(purchases.companyId, companyId), eq(purchases.status, "CONFIRMED"))),
  ]);

  // Totais apurados
  let totalRevenueCents = 0; // Receitas pagas
  let totalExpenseCents = 0; // Despesas pagas

  allTransactions.forEach((t) => {
    if (t.type === "RECEIVABLE") {
      totalRevenueCents += t.paidAmountCents || t.amountCents;
    } else if (t.type === "PAYABLE") {
      totalExpenseCents += t.paidAmountCents || t.amountCents;
    }
  });

  const totalPurchasesCents = confirmedPurchases.reduce((acc, p) => acc + p.totalCents, 0);
  const netProfitCents = totalRevenueCents - totalExpenseCents;
  const completedOrdersCount = completedOrders.length;
  const averageTicketCents =
    completedOrdersCount > 0
      ? Math.round(
          completedOrders.reduce((acc, o) => acc + o.totalCents, 0) / completedOrdersCount
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-600" />
            Relatórios Gerenciais & DRE Simplificado
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Demonstrativo de resultados, faturamento real e indicadores de performance da oficina.
          </p>
        </div>

        <button
          onClick={() => {}}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Imprimir Relatório</span>
        </button>
      </div>

      {/* Relatório Card Top / Header para Impressão */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-6">
        <h2 className="text-2xl font-black text-slate-900">{company.tradeName || company.name}</h2>
        <p className="text-xs text-slate-600">CNPJ: {company.document} | Demonstrativo de Resultado Operacional</p>
        <p className="text-[10px] text-slate-400">Gerado em: {new Date().toLocaleString("pt-BR")}</p>
      </div>

      {/* KPIs Financeiros Reais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-emerald-50/40 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Receita Efetivada
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-900">
              {(totalRevenueCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700">Títulos liquidados no caixa</div>
        </Card>

        <Card padding="sm" className="bg-rose-50/40 border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Despesas Pagas
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-900">
              {(totalExpenseCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-rose-700">Custos e despesas quitadas</div>
        </Card>

        <Card padding="sm" className="bg-sky-50/40 border-sky-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
              Resultado Líquido (DRE)
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`text-2xl font-black ${
                netProfitCents >= 0 ? "text-sky-900" : "text-rose-900"
              }`}
            >
              {(netProfitCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-sky-700">
            {netProfitCents >= 0 ? "Superávit no período" : "Déficit operacional"}
          </div>
        </Card>

        <Card padding="sm" className="bg-indigo-50/40 border-indigo-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
              Ticket Médio por OS
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-indigo-900">
              {(averageTicketCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-indigo-700">
            Baseado em {completedOrdersCount} OSs concluídas
          </div>
        </Card>
      </div>

      {/* DRE Simplificado em Tabela */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <CardHeader
            title="Demonstrativo de Resultado do Exercício (DRE)"
            subtitle="Estrutura de receitas, custos operacionais e margem de contribuição"
            className="mb-0"
          />
        </div>

        <div className="p-4 sm:p-6 space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-200 text-sm font-bold text-emerald-800 bg-emerald-50/60 px-3 rounded-lg">
            <span>(+) RECEITA OPERACIONAL BRUTA LIQUIDADA</span>
            <span>
              {(totalRevenueCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs text-rose-700 px-3">
            <span>(-) Compras de Peças e Insumos Faturadas (CMV)</span>
            <span>
              -
              {(totalPurchasesCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs text-rose-700 px-3">
            <span>(-) Outras Despesas Fixas e Variáveis Liquidadas</span>
            <span>
              -
              {(Math.max(0, totalExpenseCents - totalPurchasesCents) / 100).toLocaleString(
                "pt-BR",
                {
                  style: "currency",
                  currency: "BRL",
                }
              )}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-t-2 border-slate-300 text-base font-black px-3 rounded-lg bg-slate-100">
            <span className="text-slate-900">(=) RESULTADO OPERACIONAL LÍQUIDO</span>
            <span className={netProfitCents >= 0 ? "text-emerald-700" : "text-rose-700"}>
              {(netProfitCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </div>
      </Card>

      {/* Resumo de Eficiência Operacional */}
      <Card>
        <CardHeader
          title="Produtividade e Eficiência da Oficina"
          subtitle="Volume de atendimento e tempo de ciclo"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              OSs Finalizadas / Entregues
            </div>
            <p className="text-2xl font-black text-slate-900">{completedOrdersCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Veículos liberados com sucesso</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 font-semibold mb-1">
              <Clock className="w-4 h-4 text-sky-600" />
              Pedidos de Compra Confirmados
            </div>
            <p className="text-2xl font-black text-slate-900">{confirmedPurchases.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Entradas de mercadorias no estoque</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 font-semibold mb-1">
              <DollarSign className="w-4 h-4 text-amber-600" />
              Total em Pedidos de Peças
            </div>
            <p className="text-2xl font-black text-slate-900">
              {(totalPurchasesCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Investimento acumulado em estoque</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
