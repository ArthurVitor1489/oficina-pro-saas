import React from "react";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { purchases } from "@/db/schema/purchases";
import { suppliers } from "@/db/schema/suppliers";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ShoppingBag, PlusCircle } from "lucide-react";

export default async function PurchasesPage() {
  const { companyId } = await getTenantContext();

  const purchaseList = await db
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
    .orderBy(desc(purchases.purchaseDate));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-sky-600" />
            Compras de Peças & Insumos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Entrada de mercadorias com alimentação automática de estoque e contas a pagar.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
          Nova Compra
        </Button>
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
          <Button variant="primary" size="sm">
            Registrar Compra
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchaseList.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">
                  Compra #{String(p.purchaseNumber).padStart(4, "0")}
                </span>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">{p.supplierName}</p>
                <p className="text-slate-400 mt-0.5">NF: {p.invoiceNumber || "S/N"}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Valor Total:</span>
                <span className="text-sm font-black text-slate-900">
                  {(p.totalCents / 100).toLocaleString("pt-BR", {
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
