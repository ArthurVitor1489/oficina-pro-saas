"use client";

import React, { useState, useActionState, useEffect } from "react";
import { PlusCircle, X, AlertCircle, ArrowDownLeft, ArrowUpRight, DollarSign } from "lucide-react";
import { createTransactionAction } from "@/features/finance/actions";
import { Button } from "@/components/ui/Button";

interface TransactionModalProps {
  defaultType?: "RECEIVABLE" | "PAYABLE";
}

export function TransactionModal({ defaultType = "PAYABLE" }: TransactionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"RECEIVABLE" | "PAYABLE">(defaultType);
  const [state, formAction, isPending] = useActionState(createTransactionAction, null);

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
    }
  }, [state?.success]);

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setType("PAYABLE");
            setIsOpen(true);
          }}
          leftIcon={<ArrowUpRight className="w-4 h-4 text-rose-500" />}
        >
          Nova Despesa
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setType("RECEIVABLE");
            setIsOpen(true);
          }}
          leftIcon={<ArrowDownLeft className="w-4 h-4 text-white" />}
        >
          Nova Receita
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                    type === "RECEIVABLE" ? "bg-emerald-600" : "bg-rose-600"
                  }`}
                >
                  {type === "RECEIVABLE" ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {type === "RECEIVABLE" ? "Lançar Nova Receita" : "Lançar Nova Despesa"}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={formAction} className="mt-4 space-y-3.5">
              <input type="hidden" name="type" value={type} />

              {state?.error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* Seletor Tipo */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setType("RECEIVABLE")}
                  className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                    type === "RECEIVABLE"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Conta a Receber (Receita)
                </button>
                <button
                  type="button"
                  onClick={() => setType("PAYABLE")}
                  className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                    type === "PAYABLE"
                      ? "bg-white text-rose-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Conta a Pagar (Despesa)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição do Lançamento *
                </label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder={
                    type === "RECEIVABLE"
                      ? "Ex: Venda de bateria usada ou consultoria"
                      : "Ex: Conta de Luz Enel, Aluguel do Galpão"
                  }
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
                    placeholder="Ex: Operacional, Energia, Folha"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Forma Prevista
                  </label>
                  <select
                    name="paymentMethod"
                    defaultValue="PIX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="DINHEIRO">Dinheiro em Espécie</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="text"
                    name="amount"
                    required
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Número de documento, observações de pagamento..."
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
                <Button
                  type="submit"
                  variant={type === "RECEIVABLE" ? "primary" : "danger"}
                  size="sm"
                  isLoading={isPending}
                >
                  Confirmar Lançamento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
