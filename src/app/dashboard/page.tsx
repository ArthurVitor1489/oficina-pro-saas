import React from "react";
import Link from "next/link";
import {
  Wrench,
  FileText,
  Users,
  Car,
  AlertTriangle,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Package,
} from "lucide-react";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { workOrders } from "@/db/schema/work_orders";
import { quotes } from "@/db/schema/quotes";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { products } from "@/db/schema/products";
import { eq, and, sql, lte } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const { companyId, user, company } = await getTenantContext();

  // Consultas estritamente filtradas pelo tenant do usuário
  const [
    openWorkOrdersCount,
    inProgressWorkOrdersCount,
    pendingQuotesCount,
    customersCount,
    vehiclesCount,
    lowStockProducts,
    recentWorkOrdersList,
  ] = await Promise.all([
    // OS Abertas
    db
      .select({ count: sql<number>`count(*)` })
      .from(workOrders)
      .where(and(eq(workOrders.companyId, companyId), eq(workOrders.status, "OPEN"))),

    // OS em Execução
    db
      .select({ count: sql<number>`count(*)` })
      .from(workOrders)
      .where(and(eq(workOrders.companyId, companyId), eq(workOrders.status, "IN_PROGRESS"))),

    // Orçamentos Pendentes
    db
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(and(eq(quotes.companyId, companyId), eq(quotes.status, "PENDING_APPROVAL"))),

    // Total de Clientes
    db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.companyId, companyId)),

    // Total de Veículos
    db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(eq(vehicles.companyId, companyId)),

    // Peças com estoque baixo ou zerado
    db
      .select()
      .from(products)
      .where(
        and(
          eq(products.companyId, companyId),
          lte(products.stockQuantity, products.minStock)
        )
      )
      .limit(5),

    // OS Recentes do Tenant
    db
      .select({
        id: workOrders.id,
        orderNumber: workOrders.orderNumber,
        status: workOrders.status,
        totalCents: workOrders.totalCents,
        createdAt: workOrders.createdAt,
      })
      .from(workOrders)
      .where(eq(workOrders.companyId, companyId))
      .limit(5),
  ]);

  const stats = {
    openWO: openWorkOrdersCount[0]?.count || 0,
    inProgressWO: inProgressWorkOrdersCount[0]?.count || 0,
    pendingQuotes: pendingQuotesCount[0]?.count || 0,
    totalCustomers: customersCount[0]?.count || 0,
    totalVehicles: vehiclesCount[0]?.count || 0,
    lowStockCount: lowStockProducts.length,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-sky-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-sky-400 block mb-1">
            Painel Operacional
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Olá, {user.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Oficina: <span className="font-semibold text-white">{company.tradeName || company.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/work-orders">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Nova OS
            </Button>
          </Link>
          <Link href="/dashboard/quotes">
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
              leftIcon={<FileText className="w-4 h-4" />}
            >
              Novo Orçamento
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* OS Abertas */}
        <Card padding="sm" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">OS Abertas</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.openWO}</span>
            <span className="text-xs text-slate-500">na fila</span>
          </div>
        </Card>

        {/* OS em Execução */}
        <Card padding="sm" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">No Box</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.inProgressWO}
            </span>
            <span className="text-xs text-slate-500">em execução</span>
          </div>
        </Card>

        {/* Orçamentos Pendentes */}
        <Card padding="sm" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Orçamentos</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.pendingQuotes}
            </span>
            <span className="text-xs text-slate-500">aguardando</span>
          </div>
        </Card>

        {/* Estoque em Alerta */}
        <Card padding="sm" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Estoque Baixo</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.lowStockCount}
            </span>
            <span className="text-xs text-rose-600 font-medium">itens críticos</span>
          </div>
        </Card>
      </div>

      {/* Grid: Ações Rápidas Mobile + Estoque Crítico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ações Rápidas (Mobile-First Thumb Friendly) */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Ações Rápidas Operacionais"
            subtitle="Atalhos frequentes para mecânicos e atendentes"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/dashboard/work-orders"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800">Ordens de Serviço</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Gerenciar e atualizar</span>
            </Link>

            <Link
              href="/dashboard/quotes"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800">Orçamentos</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Enviar e aprovar</span>
            </Link>

            <Link
              href="/dashboard/customers"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800">Clientes</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Histórico e dados</span>
            </Link>

            <Link
              href="/dashboard/vehicles"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Car className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800">Veículos</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Consulta por placa</span>
            </Link>
          </div>
        </Card>

        {/* Alerta de Peças em Estoque */}
        <Card>
          <CardHeader
            title="Reposição de Peças"
            subtitle="Itens com saldo abaixo do mínimo"
            action={
              <Link
                href="/dashboard/inventory"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                Ver tudo
              </Link>
            }
          />

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-xs font-medium">Estoque 100% equilibrado!</p>
              <p className="text-[11px] text-slate-400">Nenhum item em estado crítico.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{prod.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Mínimo: {prod.minStock} {prod.unit}
                    </p>
                  </div>
                  <Badge variant="danger">
                    {prod.stockQuantity} {prod.unit}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Informações da Empresa & Multi-Tenancy Details */}
      <Card>
        <CardHeader
          title="Isolamento e Parâmetros da Empresa"
          subtitle="Garantia de segurança do tenant"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block mb-1">Tenant ID</span>
            <span className="font-mono font-bold text-slate-800 text-[11px] select-all">
              {company.id}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block mb-1">CNPJ / Documento</span>
            <span className="font-semibold text-slate-800">{company.document}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block mb-1">Plano Atual</span>
            <span className="font-semibold text-sky-700 uppercase">{company.plan}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
