import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { workOrders, workOrderItems } from "@/db/schema/work_orders";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { users } from "@/db/schema/users";
import { services } from "@/db/schema/services";
import { products } from "@/db/schema/products";
import { eq, and } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge, Badge, RoleBadge } from "@/components/ui/Badge";
import {
  ArrowLeft,
  Wrench,
  User,
  Car,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  Phone,
  MessageSquare,
  FileText,
} from "lucide-react";
import { WorkOrderControls } from "./work-order-controls";

interface WorkOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkOrderDetailPage({ params }: WorkOrderDetailPageProps) {
  const { id } = await params;
  const { companyId, user: currentUser } = await getTenantContext();

  const orderList = await db
    .select({
      id: workOrders.id,
      orderNumber: workOrders.orderNumber,
      status: workOrders.status,
      notes: workOrders.notes,
      internalNotes: workOrders.internalNotes,
      subtotalCents: workOrders.subtotalCents,
      discountCents: workOrders.discountCents,
      totalCents: workOrders.totalCents,
      startedAt: workOrders.startedAt,
      finishedAt: workOrders.finishedAt,
      deliveredAt: workOrders.deliveredAt,
      fromQuoteId: workOrders.fromQuoteId,
      createdAt: workOrders.createdAt,
      customerId: workOrders.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerWhatsapp: customers.whatsapp,
      vehicleId: workOrders.vehicleId,
      vehiclePlate: vehicles.plate,
      vehicleBrand: vehicles.brand,
      vehicleModel: vehicles.model,
      vehicleMileage: vehicles.mileage,
      assignedUserId: workOrders.assignedUserId,
      assignedUserName: users.name,
    })
    .from(workOrders)
    .leftJoin(customers, eq(workOrders.customerId, customers.id))
    .leftJoin(vehicles, eq(workOrders.vehicleId, vehicles.id))
    .leftJoin(users, eq(workOrders.assignedUserId, users.id))
    .where(and(eq(workOrders.id, id), eq(workOrders.companyId, companyId)))
    .limit(1);

  if (orderList.length === 0) {
    notFound();
  }

  const order = orderList[0];

  // Buscar itens da OS e catálogos para o modal
  const [items, catalogServices, catalogProducts] = await Promise.all([
    db
      .select()
      .from(workOrderItems)
      .where(and(eq(workOrderItems.workOrderId, id), eq(workOrderItems.companyId, companyId))),

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

  const totalFormatted = (order.totalCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const cleanPhone = (order.customerWhatsapp || order.customerPhone)?.replace(/\D/g, "");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <Link
          href="/dashboard/work-orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Ordens de Serviço</span>
        </Link>

        <WorkOrderControls
          orderId={order.id}
          orderNumber={order.orderNumber}
          currentStatus={order.status}
          services={catalogServices}
          products={catalogProducts}
        />
      </div>

      {/* Main OS Banner */}
      <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Ordem de Serviço #{String(order.orderNumber).padStart(4, "0")}
                </h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Aberta em: {new Date(order.createdAt).toLocaleString("pt-BR")}
                {order.startedAt && (
                  <span> • Iniciada: {new Date(order.startedAt).toLocaleTimeString("pt-BR")}</span>
                )}
                {order.finishedAt && (
                  <span>
                    {" "}
                    • Finalizada: {new Date(order.finishedAt).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block">Total da OS:</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 text-sky-700">
              {totalFormatted}
            </span>
          </div>
        </div>

        {/* Cliente, Veículo e Responsável */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Cliente */}
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-sky-600" /> Cliente
              </span>
              {cleanPhone && (
                <a
                  href={`https://wa.me/55${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 print:hidden"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
            <Link
              href={`/dashboard/customers/${order.customerId}`}
              className="font-bold text-slate-900 text-sm hover:text-sky-600 block"
            >
              {order.customerName}
            </Link>
            <span className="text-slate-500 mt-0.5 block">{order.customerPhone || "Sem telefone"}</span>
          </div>

          {/* Veículo */}
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-sky-600" /> Veículo no Box
            </span>
            {order.vehiclePlate ? (
              <div>
                <Link
                  href={`/dashboard/vehicles/${order.vehicleId}`}
                  className="font-bold text-slate-900 text-sm hover:text-sky-600 block"
                >
                  {order.vehicleBrand} {order.vehicleModel}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono font-bold text-xs text-white bg-slate-900 px-1.5 py-0.5 rounded">
                    {order.vehiclePlate}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {order.vehicleMileage?.toLocaleString("pt-BR")} km
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-slate-400 italic">Sem veículo vinculado</span>
            )}
          </div>

          {/* Mecânico Responsável */}
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-sky-600" /> Técnico no Box
            </span>
            <span className="font-bold text-slate-900 text-sm block">
              {order.assignedUserName || "Não atribuído"}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {order.fromQuoteId ? "Convertida de Orçamento" : "Abertura Direta"}
            </span>
          </div>
        </div>

        {/* Sintomas e Diagnóstico */}
        {(order.notes || order.internalNotes) && (
          <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {order.notes && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">
                  Sintomas / Queixa do Cliente:
                </span>
                <p className="text-slate-600">{order.notes}</p>
              </div>
            )}
            {order.internalNotes && (
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/70">
                <span className="font-bold text-amber-900 block mb-1">
                  Diagnóstico Técnico Interno:
                </span>
                <p className="text-amber-800">{order.internalNotes}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Itens Executados (Serviços e Peças Aplicadas) */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <CardHeader
            title={`Itens Aplicados na OS (${items.length})`}
            subtitle="Mão de obra realizada e peças instaladas no veículo"
            className="mb-0"
          />
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium">Nenhum serviço ou peça lançado nesta OS.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              O mecânico pode adicionar peças e mão de obra utilizando o botão no topo.
            </p>
          </div>
        ) : (
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
        )}

        {/* Resumo Financeiro da OS */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col items-end text-xs space-y-1.5">
          <div className="flex justify-between w-64 text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold">
              {(order.subtotalCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>

          {order.discountCents > 0 && (
            <div className="flex justify-between w-64 text-rose-600">
              <span>Desconto:</span>
              <span className="font-semibold">
                -
                {(order.discountCents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          )}

          <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
            <span>Total da OS:</span>
            <span className="text-base text-sky-700">{totalFormatted}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
