"use client";

import React, { useState, useActionState, useEffect } from "react";
import { PlusCircle, X, AlertCircle, Truck, Phone, Mail, Building2 } from "lucide-react";
import { createSupplierAction } from "@/features/suppliers/actions";
import { Button } from "@/components/ui/Button";

export function SupplierModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createSupplierAction, null);

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
        Novo Fornecedor
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Cadastrar Fornecedor</h3>
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
                  Razão Social *
                </label>
                <input
                  type="text"
                  name="legalName"
                  required
                  placeholder="Ex: Distribuidora Nacional de Autopeças S/A"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    name="tradeName"
                    placeholder="Ex: Nacional Peças"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    name="document"
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="(11) 9999-9999"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail Comercial
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="pedidos@fornecedor.com.br"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder="São Paulo"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    name="state"
                    maxLength={2}
                    placeholder="SP"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações e Prazos de Pagamento
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Vendedor de contato, prazo de faturamento (ex: 30 dias boleto)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
                />
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
                  Salvar Fornecedor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
