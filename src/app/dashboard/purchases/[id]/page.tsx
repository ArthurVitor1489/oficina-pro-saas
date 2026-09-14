import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { purchases, purchaseItems } from "@/db/schema/purchases";
import { suppliers } from "@/db/schema/suppliers";
import { products } from "@/db/schema/products";
import { attachments } from "@/db/schema/attachments";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { ArrowLeft, ShoppingBag, Truck, Calendar, DollarSign, Package } from "lucide-react";
import { PurchaseActionControls } from "./purchase-actions";
import { AttachmentSection } from "@/components/attachments/attachment-section";

interface PurchaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseDetailPage({ params }: PurchaseDetailPageProps) {
  const { id } = await params;
  const { companyId } = await getTenantContext();

  const purchaseList = await db
    .select({
      id: purchases.id,
      purchaseNumber: purchases.purchaseNumber,
      invoiceNumber: purchases.invoiceNumber,
      status: purchases.status,
      purchaseDate: purchases.purchaseDate,
      subtotalCents: purchases.subtotalCents,
      freightCents: purchases.freightCents,
      discountCents: purchases.discountCents,
      totalCents: purchases.totalCents,
      paymentTerms: purchases.paymentTerms,
      notes: purchases.notes,
      supplierId: purchases.supplierId,
      supplierName: suppliers.tradeName,
      supplierLegalName: suppliers.legalName,
      supplierDocument: suppliers.document,
      supplierPhone: suppliers.phone,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .where(and(eq(purchases.id, id), eq(purchases.companyId, companyId)))
    .limit(1);

  if (purchaseList.length === 0) {
    notFound();
  }

  const purchase = purchaseList[0];

  // Buscar itens da compra e anexos/XML
  const [items, purchaseAttachments] = await Promise.all([
    db
      .select({
        id: purchaseItems.id,
        quantity: purchaseItems.quantity,
        unitCostCents: purchaseItems.unitCostCents,
        totalCostCents: purchaseItems.totalCostCents,
        productName: products.name,
        productUnit: products.unit,
        productSku: products.skuCode,
      })
      .from(purchaseItems)
      .leftJoin(products, eq(purchaseItems.productId, products.id))
      .where(and(eq(purchaseItems.purchaseId, id), eq(purchaseItems.companyId, companyId))),

    db
      .select()
      .from(attachments)
      .where(
        and(
          eq(attachments.companyId, companyId),
          eq(attachments.entityType, "PURCHASE"),
          eq(attachments.entityId, id)
        )
      )
      .orderBy(desc(attachments.createdAt)),
  ]);

  const totalFormatted = (purchase.totalCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/dashboard/purchases"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Compras</span>
        </Link>

        <PurchaseActionControls
          purchaseId={purchase.id}
          isConfirmed={purchase.status === "CONFIRMED"}
        />
      </div>

      <Card className="bg-gradient-to-br from-white to-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  Compra #{String(purchase.purchaseNumber).padStart(4, "0")}
                </h1>
                <StatusBadge status={purchase.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Data: {new Date(purchase.purchaseDate).toLocaleDateString("pt-BR")}
                {purchase.invoiceNumber && <span> • Nota Fiscal: {purchase.invoiceNumber}</span>}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block">Total da Compra:</span>
            <span className="text-2xl font-black text-slate-900 text-amber-700">
              {totalFormatted}
            </span>
          </div>
        </div>

        {/* Informações Fornecedor e Faturamento */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-sky-600" /> Fornecedor
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {purchase.supplierName || purchase.supplierLegalName}
            </p>
            <p className="text-slate-500 font-mono mt-0.5">
              CNPJ: {purchase.supplierDocument || "Não informado"}
            </p>
            {purchase.supplierPhone && (
              <p className="text-slate-500 mt-0.5">Tel: {purchase.supplierPhone}</p>
            )}
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-sky-600" /> Condições Comerciais
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {purchase.paymentTerms || "À Vista"}
            </p>
            <p className="text-slate-500 mt-0.5">
              Frete:{" "}
              {(purchase.freightCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
        </div>

        {purchase.notes && (
          <div className="mt-3 p-3 bg-slate-100 rounded-lg text-xs text-slate-700">
            <span className="font-semibold block mb-0.5">Observações:</span>
            <span>{purchase.notes}</span>
          </div>
        )}
      </Card>

      {/* Tabela de Peças */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <CardHeader
            title={`Itens da Compra (${items.length})`}
            subtitle="Autopeças e insumos faturados pelo fornecedor"
            className="mb-0"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4 sm:px-6">Produto / Peça</th>
                <th className="py-3 px-4 sm:px-6 text-center">Quantidade</th>
                <th className="py-3 px-4 sm:px-6 text-right">Custo Unitário</th>
                <th className="py-3 px-4 sm:px-6 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6">
                    <p className="font-bold text-slate-900">{item.productName}</p>
                    {item.productSku && (
                      <p className="text-[11px] font-mono text-slate-400">SKU: {item.productSku}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-center font-bold text-slate-700">
                    {item.quantity} {item.productUnit || "UN"}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right text-slate-600">
                    {(item.unitCostCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-black text-slate-900">
                    {(item.totalCostCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Anexos e XML da NF-e */}
      <AttachmentSection
        entityType="PURCHASE"
        entityId={purchase.id}
        initialAttachments={purchaseAttachments}
        title="Arquivos Fiscais, XML da NF-e e Comprovantes"
      />
    </div>
  );
}
