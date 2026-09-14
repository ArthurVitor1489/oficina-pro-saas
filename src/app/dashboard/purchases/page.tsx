import React from "react";
import Link from "next/link";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { purchases } from "@/db/schema/purchases";
import { suppliers } from "@/db/schema/suppliers";
import { products } from "@/db/schema/products";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { PurchaseModal } from "./purchase-modal";
import { ImportNfeModal } from "./import-nfe-modal";

export default async function PurchasesPage() {
  const { companyId } = await getTenantContext();

  const [purchaseList, suppliersList, productsList] = await Promise.all([
    db
      .select({
        id: purchases.id,
        purchaseNumber: purchases.purchaseNumber,
        invoiceNumber: purchases.invoiceNumber,
        status: purchases.status,
        totalCents: purchases.totalCents,
        purchaseDate: purchases.purchaseDate,
        supplierName: suppliers.tradeName,
      })
      .from(purchases)
      .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .where(eq(purchases.companyId, companyId))
      .orderBy(desc(purchases.purchaseDate)),

    db
      .select({
        id: suppliers.id,
        tradeName: suppliers.tradeName,
        legalName: suppliers.legalName,
      })
      .from(suppliers)
      .where(eq(suppliers.companyId, companyId)),

    db
      .select({
        id: products.id,
        name: products.name,
        costPriceCents: products.costPriceCents,
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
            <ShoppingBag className="w-6 h-6 text-sky-600" />
            Compras de Peças & Insumos ({purchaseList.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Entrada de mercadorias com alimentação automática de estoque e contas a pagar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ImportNfeModal />
          <PurchaseModal suppliers={suppliersList} products={productsList} />
        </div>
      </div>

      {purchaseList.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhuma compra registrada</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Registre compras de autopeças de fornecedores para dar entrada no estoque e gerar financeiro.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchaseList.map((p) => (
            <Card key={p.id} className="hover:border-sky-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <Link
                    href={`/dashboard/purchases/${p.id}`}
                    className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors"
                  >
                    Compra #{String(p.purchaseNumber).padStart(4, "0")}
                  </Link>
                  <StatusBadge status={p.status} />
                </div>

                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">{p.supplierName}</p>
                  <p className="text-slate-500">NF: {p.invoiceNumber || "Sem Nota Fiscal"}</p>
                  <p className="text-slate-400 text-[11px] pt-1">
                    Data: {new Date(p.purchaseDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total:</span>
                  <span className="text-sm font-black text-slate-900">
                    {(p.totalCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>

                <Link
                  href={`/dashboard/purchases/${p.id}`}
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
