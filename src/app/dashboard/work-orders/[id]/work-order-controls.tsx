"use client";

import React, { useState, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  CheckCircle2,
  Truck,
  PlusCircle,
  Printer,
  Wrench,
  Package,
  X,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { updateWorkOrderStatusAction, addWorkOrderItemAction } from "@/features/work-orders/actions";
import { Button } from "@/components/ui/Button";
import { WorkOrderStatus } from "@/db/schema/work_orders";

interface CatalogService {
  id: string;
  name: string;
  basePriceCents: number;
}

interface CatalogProduct {
  id: string;
  name: string;
  salePriceCents: number;
  stockQuantity: number;
  unit: string;
}

interface WorkOrderControlsProps {
  orderId: string;
  orderNumber: number;
  currentStatus: WorkOrderStatus;
  services: CatalogService[];
  products: CatalogProduct[];
}

export function WorkOrderControls({
  orderId,
  orderNumber,
  currentStatus,
  services,
  products,
}: WorkOrderControlsProps) {
  const router = useRouter();
  const [isTransitionPending, startTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);

  // Modal de adicionar item
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [itemType, setItemType] = useState<"SERVICE" | "PRODUCT">("SERVICE");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [addItemState, addAction, isAddPending] = useActionState(
    addWorkOrderItemAction.bind(null, orderId),
    null
  );

  React.useEffect(() => {
    if (addItemState?.success) {
      setIsAddItemOpen(false);
      setDescription("");
      setUnitPrice("");
      setSelectedServiceId("");
      setSelectedProductId("");
      router.refresh();
    }
  }, [addItemState?.success, router]);

  const handleStatusChange = (newStatus: WorkOrderStatus) => {
    setStatusError(null);
    startTransition(async () => {
      const res = await updateWorkOrderStatusAction(orderId, newStatus);
      if (res?.error) {
        setStatusError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleServiceSelect = (svcId: string) => {
    setSelectedServiceId(svcId);
    const svc = services.find((s) => s.id === svcId);
    if (svc) {
      setDescription(svc.name);
      setUnitPrice((svc.basePriceCents / 100).toFixed(2));
    }
  };

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setDescription(prod.name);
      setUnitPrice((prod.salePriceCents / 100).toFixed(2));
    }
  };

  return (
    <div className="space-y-3">
      {statusError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{statusError}</span>
        </div>
      )}

      {/* Botões Operacionais Rápidos para Mecânico e Gerência */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Adicionar Item (Peça ou Serviço) */}
        {currentStatus !== "FINISHED" && currentStatus !== "DELIVERED" && currentStatus !== "CANCELED" && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddItemOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Adicionar Item (Peça/Serviço)
          </Button>
        )}

        {/* Iniciar Serviço */}
        {(currentStatus === "OPEN" || currentStatus === "APPROVED" || currentStatus === "WAITING_PART") && (
          <Button
            variant="outline"
            size="sm"
            isLoading={isTransitionPending}
            onClick={() => handleStatusChange("IN_PROGRESS")}
            className="border-amber-400 text-amber-800 bg-amber-50 hover:bg-amber-100"
            leftIcon={<Play className="w-4 h-4 fill-current text-amber-600" />}
          >
            Iniciar Serviço no Box
          </Button>
        )}

        {/* Aguardar Peça */}
        {currentStatus === "IN_PROGRESS" && (
          <Button
            variant="outline"
            size="sm"
            isLoading={isTransitionPending}
            onClick={() => handleStatusChange("WAITING_PART")}
            className="border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100"
            leftIcon={<Pause className="w-4 h-4" />}
          >
            Aguardar Peça
          </Button>
        )}

        {/* Finalizar Serviço */}
        {currentStatus === "IN_PROGRESS" && (
          <Button
            variant="outline"
            size="sm"
            isLoading={isTransitionPending}
            onClick={() => handleStatusChange("FINISHED")}
            className="border-emerald-500 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold"
            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          >
            Finalizar OS
          </Button>
        )}

        {/* Entregar Veículo */}
        {currentStatus === "FINISHED" && (
          <Button
            variant="primary"
            size="sm"
            isLoading={isTransitionPending}
            onClick={() => handleStatusChange("DELIVERED")}
            className="bg-emerald-600 hover:bg-emerald-700 font-bold"
            leftIcon={<CheckCircle2 className="w-4 h-4 text-white" />}
          >
            Entregar ao Cliente
          </Button>
        )}

        {/* Cancelar OS */}
        {currentStatus !== "DELIVERED" && currentStatus !== "CANCELED" && (
          <button
            type="button"
            disabled={isTransitionPending}
            onClick={() => {
              if (confirm("Deseja realmente cancelar esta Ordem de Serviço?")) {
                handleStatusChange("CANCELED");
              }
            }}
            className="p-2 text-slate-400 hover:text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-50 transition-colors"
            title="Cancelar OS"
          >
            Cancelar
          </button>
        )}

        {/* Imprimir OS */}
        <button
          type="button"
          onClick={() => window.print()}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Imprimir Ficha de OS"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>

      {/* Modal Adicionar Item à OS */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Adicionar à OS #{String(orderNumber).padStart(4, "0")}
                </h3>
              </div>
              <button
                onClick={() => setIsAddItemOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={addAction} className="mt-4 space-y-3.5">
              {addItemState?.error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {addItemState.error}
                </div>
              )}

              {/* Seletor Tipo: Serviço ou Peça */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setItemType("SERVICE");
                    setSelectedProductId("");
                    setDescription("");
                    setUnitPrice("");
                  }}
                  className={`py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    itemType === "SERVICE"
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Mão de Obra</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setItemType("PRODUCT");
                    setSelectedServiceId("");
                    setDescription("");
                    setUnitPrice("");
                  }}
                  className={`py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    itemType === "PRODUCT"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Peça / Insumo</span>
                </button>
              </div>

              <input type="hidden" name="type" value={itemType} />
              <input
                type="hidden"
                name="serviceId"
                value={itemType === "SERVICE" ? selectedServiceId : ""}
              />
              <input
                type="hidden"
                name="productId"
                value={itemType === "PRODUCT" ? selectedProductId : ""}
              />

              {/* Seletor de Catálogo */}
              {itemType === "SERVICE" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selecionar do Catálogo de Serviços
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => handleServiceSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">Selecione um serviço ou digite abaixo...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (
                        {(s.basePriceCents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                        )
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selecionar do Estoque de Peças
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">Selecione uma peça em estoque ou digite abaixo...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - Saldo: {p.stockQuantity} {p.unit} (
                        {(p.salePriceCents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                        )
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição do Item *
                </label>
                <input
                  type="text"
                  name="description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Troca de óleo mineral ou Filtro de combustível"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Quantidade e Valor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço Unitário (R$) *
                  </label>
                  <input
                    type="text"
                    name="unitPrice"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {itemType === "PRODUCT" && selectedProductId && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ Ao confirmar, o saldo desta peça será reduzido no estoque e registrado em movimentações.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddItemOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isAddPending}>
                  Adicionar à OS
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
