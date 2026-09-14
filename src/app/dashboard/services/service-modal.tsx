"use client";

import React, { useState, useActionState, useEffect } from "react";
import { PlusCircle, X, AlertCircle, Settings, Clock, DollarSign } from "lucide-react";
import { createServiceAction } from "@/features/services/actions";
import { Button } from "@/components/ui/Button";

export function ServiceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createServiceAction, null);

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
        Novo Serviço
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Cadastrar Serviço</h3>
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
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ex: Troca de Pastilhas de Freio"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    name="category"
                    placeholder="Ex: Freios, Revisão"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tempo Estimado (min)
                  </label>
                  <input
                    type="number"
                    name="estimatedMinutes"
                    defaultValue={60}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preço Base Padrão (R$) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                    R$
                  </div>
                  <input
                    type="text"
                    name="basePrice"
                    required
                    placeholder="150,00"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição dos Procedimentos
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="O que está incluso na execução desta mão de obra..."
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
                  Salvar Serviço
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
