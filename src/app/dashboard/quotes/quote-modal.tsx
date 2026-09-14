"use client";

import React, { useState, useActionState, useEffect } from "react";
import { PlusCircle, X, Trash2, FileText, AlertCircle, Wrench, Package, ArrowRight } from "lucide-react";
import { createQuoteAction, CreateQuoteItemInput } from "@/features/quotes/actions";
import { Button } from "@/components/ui/Button";

interface CustomerOption {
  id: string;
  name: string;
}

interface VehicleOption {
  id: string;
  customerId: string;
  plate: string;
  model: string;
}

interface ServiceOption {
  id: string;
  name: string;
  basePriceCents: number;
}

interface ProductOption {
  id: string;
  name: string;
  salePriceCents: number;
  stockQuantity: number;
  unit: string;
}

interface QuoteModalProps {
  customers: CustomerOption[];
  vehicles: VehicleOption[];
  services: ServiceOption[];
  products: ProductOption[];
}

export function QuoteModal({
  customers,
  vehicles,
  services,
  products,
}: QuoteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createQuoteAction, null);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [items, setItems] = useState<CreateQuoteItemInput[]>([]);
  const [discountStr, setDiscountStr] = useState("0");
  const [validDays, setValidDays] = useState("15");
  const [notes, setNotes] = useState("");

  // Filtrar veículos do cliente selecionado
  const customerVehicles = vehicles.filter((v) => v.customerId === selectedCustomerId);

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
      setItems([]);
      setSelectedCustomerId("");
      setSelectedVehicleId("");
      setDiscountStr("0");
    }
  }, [state?.success]);

  const addItemFromService = (svcId: string) => {
    const svc = services.find((s) => s.id === svcId);
    if (!svc) return;
    setItems([
      ...items,
      {
        type: "SERVICE",
        serviceId: svc.id,
        description: svc.name,
        quantity: 1,
        unitPriceCents: svc.basePriceCents,
        discountCents: 0,
      },
    ]);
  };

  const addItemFromProduct = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    setItems([
      ...items,
      {
        type: "PRODUCT",
        productId: prod.id,
        description: prod.name,
        quantity: 1,
        unitPriceCents: prod.salePriceCents,
        discountCents: 0,
      },
    ]);
  };

  const addCustomItem = () => {
    setItems([
      ...items,
      {
        type: "SERVICE",
        description: "Serviço personalizado",
        quantity: 1,
        unitPriceCents: 10000, // R$ 100,00
        discountCents: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQty = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, qty);
    setItems(updated);
  };

  const updateItemPrice = (index: number, priceReais: string) => {
    const updated = [...items];
    const val = parseFloat(priceReais.replace(",", ".")) || 0;
    updated[index].unitPriceCents = Math.round(val * 100);
    setItems(updated);
  };

  // Cálculo ao vivo
  const subtotalCents = items.reduce(
    (acc, item) => acc + item.quantity * item.unitPriceCents,
    0
  );
  const discountCents = Math.round((parseFloat(discountStr.replace(",", ".")) || 0) * 100);
  const totalCents = Math.max(0, subtotalCents - discountCents);

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setIsOpen(true)}
        leftIcon={<PlusCircle className="w-4 h-4" />}
      >
        Novo Orçamento
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Gerar Novo Orçamento</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={formAction} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />

              {state?.error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* Seção Cliente e Veículo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    name="customerId"
                    required
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      setSelectedVehicleId("");
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="" disabled>
                      Selecione o cliente...
                    </option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Veículo do Cliente
                  </label>
                  <select
                    name="vehicleId"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    disabled={!selectedCustomerId || customerVehicles.length === 0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {customerVehicles.length === 0
                        ? "Nenhum veículo cadastrado"
                        : "Selecione o veículo..."}
                    </option>
                    {customerVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} - {v.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Adicionar Itens */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Itens do Orçamento ({items.length})
                  </span>

                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addItemFromService(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      defaultValue=""
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="" disabled>
                        + Adicionar Serviço...
                      </option>
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

                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addItemFromProduct(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      defaultValue=""
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="" disabled>
                        + Adicionar Peça...
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {p.stockQuantity} {p.unit} (
                          {(p.salePriceCents / 100).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                          )
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={addCustomItem}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium text-xs"
                    >
                      + Avulso
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400 italic">
                    Nenhum item adicionado. Selecione serviços ou peças acima.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {item.type === "SERVICE" ? (
                            <span className="p-1 rounded bg-sky-50 text-sky-600 font-bold text-[10px]">
                              SERV
                            </span>
                          ) : (
                            <span className="p-1 rounded bg-emerald-50 text-emerald-600 font-bold text-[10px]">
                              PEÇA
                            </span>
                          )}
                          <span className="font-semibold text-slate-800 truncate">
                            {item.description}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Qtd:</span>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateItemQty(index, parseInt(e.target.value, 10))}
                              className="w-14 px-1.5 py-1 border border-slate-300 rounded text-center text-xs font-bold"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">R$:</span>
                            <input
                              type="text"
                              defaultValue={(item.unitPriceCents / 100).toFixed(2)}
                              onBlur={(e) => updateItemPrice(index, e.target.value)}
                              className="w-20 px-1.5 py-1 border border-slate-300 rounded text-right text-xs font-bold"
                            />
                          </div>

                          <span className="font-black text-slate-900 w-24 text-right">
                            {((item.quantity * item.unitPriceCents) / 100).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desconto, Validade e Totais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Desconto Geral (R$)
                  </label>
                  <input
                    type="text"
                    name="discount"
                    value={discountStr}
                    onChange={(e) => setDiscountStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Validade da Proposta (Dias)
                  </label>
                  <input
                    type="number"
                    name="validDays"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condições / Observações do Orçamento
                  </label>
                  <textarea
                    name="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Forma de pagamento (ex: até 3x sem juros), garantia das peças..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Totalizador Footer */}
              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Subtotal:</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {(subtotalCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Final:</span>
                  <span className="text-xl font-black text-slate-900">
                    {(totalCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isPending}
                  disabled={items.length === 0}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Salvar Orçamento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
