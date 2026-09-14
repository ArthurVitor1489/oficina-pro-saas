"use client";

import React, { useState, useActionState, useEffect } from "react";
import { PlusCircle, X, AlertCircle, Package, Layers, MapPin } from "lucide-react";
import { createProductAction } from "@/features/inventory/actions";
import { Button } from "@/components/ui/Button";

export function ProductModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createProductAction, null);

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
    }
  }, [state?.success]);

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setIsOpen(true)}
        leftIcon={<PlusCircle className="w-4 h-4" />}
      >
        Nova Peça
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Cadastrar Peça / Produto</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={formAction} className="mt-4 space-y-3.5">
              {state?.error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{state.error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição da Peça / Produto *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ex: Óleo Sintético 5W30 1L ou Filtro de Óleo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código / SKU
                  </label>
                  <input
                    type="text"
                    name="skuCode"
                    placeholder="Ex: BOS-1234"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fabricante / Marca
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    placeholder="Ex: Bosch, Motul, Cofap"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    name="category"
                    placeholder="Ex: Freios, Lubrificantes, Filtros"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    name="unit"
                    defaultValue="UN"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="UN">Unidade (UN)</option>
                    <option value="L">Litros (L)</option>
                    <option value="PAR">Par (PAR)</option>
                    <option value="KIT">Kit (KIT)</option>
                    <option value="KG">Quilogramas (KG)</option>
                    <option value="M">Metros (M)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="text"
                    name="costPrice"
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="text"
                    name="salePrice"
                    required
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    name="initialStock"
                    defaultValue={0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    name="minStock"
                    defaultValue={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Localização / Box
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="Prateleira A2"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isPending}>
                  Salvar Peça
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
