import React from "react";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { products } from "@/db/schema/products";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Package, AlertCircle } from "lucide-react";
import { ProductModal } from "./product-modal";
import { AdjustStockModal } from "./adjust-stock-modal";

export default async function InventoryPage() {
  const { companyId } = await getTenantContext();

  const productList = await db
    .select()
    .from(products)
    .where(eq(products.companyId, companyId))
    .orderBy(desc(products.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-sky-600" />
            Peças & Controle de Estoque ({productList.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastro de autopeças, controle de saldo e rastreabilidade por movimentações.
          </p>
        </div>

        <ProductModal />
      </div>

      {productList.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhuma peça cadastrada</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Cadastre peças e insumos para aplicar em ordens de serviço e controlar estoque mínimo.
          </p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4 sm:px-6">Código / Peça</th>
                  <th className="py-3 px-4 sm:px-6">Categoria</th>
                  <th className="py-3 px-4 sm:px-6">Saldo</th>
                  <th className="py-3 px-4 sm:px-6">Custo</th>
                  <th className="py-3 px-4 sm:px-6">Preço Venda</th>
                  <th className="py-3 px-4 sm:px-6">Local</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productList.map((prod) => {
                  const isLow = prod.stockQuantity <= prod.minStock;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <p className="font-bold text-slate-900">{prod.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">
                          {prod.skuCode || "SEM SKU"} • {prod.manufacturer || "Genérico"}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                        {prod.category || "-"}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">
                            {prod.stockQuantity} {prod.unit}
                          </span>
                          {isLow && (
                            <Badge variant="danger" size="sm">
                              Baixo
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                        {(prod.costPriceCents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-emerald-700">
                        {(prod.salePriceCents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                        {prod.location || "-"}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <AdjustStockModal
                          productId={prod.id}
                          productName={prod.name}
                          currentStock={prod.stockQuantity}
                          unit={prod.unit}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
