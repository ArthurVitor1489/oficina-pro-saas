"use client";

import React, { useState, useActionState, useEffect } from "react";
import { PlusCircle, X, ShoppingBag, AlertCircle, Trash2, Package, Truck, ArrowRight } from "lucide-react";
import { createPurchaseAction, CreatePurchaseItemInput } from "@/features/purchases/actions";
import { Button } from "@/components/ui/Button";

interface SupplierOption {
  id: string;
  tradeName: string | null;
  legalName: string;
}

interface ProductOption {
  id: string;
  name: string;
  costPriceCents: number;
  stockQuantity: number;
  unit: string;
}

interface PurchaseModalProps {
  suppliers: SupplierOption[];
  products: ProductOption[];
}

export function PurchaseModal({ suppliers, products }: PurchaseModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createPurchaseAction, null);

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("30 dias (Boleto)");
  const [dueDate, setDueDate] = useState("");
  const [freightStr, setFreightStr] = useState("0");
  const [discountStr, setDiscountStr] = useState("0");
  const [notes, setNotes] = useState("");
  const [autoConfirm, setAutoConfirm] = useState(true);

  const [items, setItems] = useState<
    { productId: string; name: string; unit: string; quantity: number; unitCostCents: number }[]
  >([]);

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
      setItems([]);
      setSelectedSupplierId("");
      setInvoiceNumber("");
      setFreightStr("0");
      setDiscountStr("0");
    }
  }, [state?.success]);

  const addProductItem = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    // Verificar se já existe na lista
    const existingIndex = items.findIndex((i) => i.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          name: prod.name,
          unit: prod.unit,
          quantity: 1,
          unitCostCents: prod.costPriceCents,
        },
      ]);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQty = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, qty);
    setItems(updated);
  };

  const updateItemCost = (index: number, costReais: string) => {
    const updated = [...items];
    const val = parseFloat(costReais.replace(",", ".")) || 0;
    updated[index].unitCostCents = Math.round(val * 100);
    setItems(updated);
  };

  const subtotalCents = items.reduce(
    (acc, item) => acc + item.quantity * item.unitCostCents,
    0
  );
  const freightCents = Math.round((parseFloat(freightStr.replace(",", ".")) || 0) * 100);
  const discountCents = Math.round((parseFloat(discountStr.replace(",", ".")) || 0) * 100);
  const totalCents = Math.max(0, subtotalCents + freightCents - discountCents);

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setIsOpen(true)}
        leftIcon={<PlusCircle className="w-4 h-4" />}
      >
        Nova Compra
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Registrar Compra de Peças</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={formAction} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <input
                type="hidden"
                name="itemsJson"
                value={JSON.stringify(
                  items.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    unitCostCents: i.unitCostCents,
                  }))
                )}
              />
              <input type="hidden" name="autoConfirm" value={autoConfirm ? "true" : "false"} />

              {state?.error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* Fornecedor e Nota Fiscal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fornecedor *
                  </label>
                  <select
                    name="supplierId"
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="" disabled>
                      Selecione o fornecedor...
                    </option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tradeName || s.legalName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número da NF-e / Pedido
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Ex: NF 104523"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Seleção de Produtos da Compra */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Peças Compradas ({items.length})
                  </span>

                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addProductItem(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    className="px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="" disabled>
                      + Adicionar Peça do Estoque...
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Atual: {p.stockQuantity} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {items.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400 italic">
                    Nenhuma peça selecionada. Escolha as peças compradas no seletor acima.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                      >
                        <span className="font-semibold text-slate-800 flex-1 truncate">
                          {item.name}
                        </span>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Qtd ({item.unit}):</span>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateItemQty(index, parseInt(e.target.value, 10))}
                              className="w-14 px-1.5 py-1 border border-slate-300 rounded text-center text-xs font-bold"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Custo:</span>
                            <input
                              type="text"
                              defaultValue={(item.unitCostCents / 100).toFixed(2)}
                              onBlur={(e) => updateItemCost(index, e.target.value)}
                              className="w-20 px-1.5 py-1 border border-slate-300 rounded text-right text-xs font-bold"
                            />
                          </div>

                          <span className="font-black text-slate-900 w-24 text-right">
                            {((item.quantity * item.unitCostCents) / 100).toLocaleString("pt-BR", {
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

              {/* Condição de Pagamento e Frete */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condição de Pagamento
                  </label>
                  <input
                    type="text"
                    name="paymentTerms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="30 dias / Boleto"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frete (R$)
                  </label>
                  <input
                    type="text"
                    name="freight"
                    value={freightStr}
                    onChange={(e) => setFreightStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkbox de Confirmação Automática de Estoque */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-900 block">
                    Confirmar Entrada Imediata no Estoque & Financeiro
                  </span>
                  <span className="text-emerald-700 text-[11px]">
                    Adiciona o saldo das peças ao estoque e gera parcela no Contas a Pagar.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoConfirm}
                  onChange={(e) => setAutoConfirm(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>

              {/* Totalizador Footer */}
              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Subtotal Peças:</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {(subtotalCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total da Compra:</span>
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
                  Registrar Compra
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
