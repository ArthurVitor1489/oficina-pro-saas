"use client";

import React, { useState, useActionState, useEffect } from "react";
import { SlidersHorizontal, X, AlertCircle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { adjustStockAction } from "@/features/inventory/actions";
import { Button } from "@/components/ui/Button";

interface AdjustStockModalProps {
  productId: string;
  productName: string;
  currentStock: number;
  unit: string;
}

export function AdjustStockModal({
  productId,
  productName,
  currentStock,
  unit,
}: AdjustStockModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(adjustStockAction, null);

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
    }
  }, [state?.success]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200"
      >
        Ajustar Saldo
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ajuste de Saldo em Estoque</h3>
                <p className="text-xs text-slate-500 font-medium truncate max-w-[280px]">
                  {productName}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={formAction} className="mt-4 space-y-3.5">
              <input type="hidden" name="productId" value={productId} />

              {state?.error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{state.error}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Saldo Atual do Produto:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {currentStock} {unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo / Tipo de Ajuste *
                </label>
                <select
                  name="type"
                  defaultValue="ADJUSTMENT"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="ADJUSTMENT">Ajuste de Balanço / Inventário (Físico vs Sistema)</option>
                  <option value="RETURN">Devolução ao Estoque</option>
                  <option value="TRANSFER">Transferência entre Boxes</option>
                  <option value="PURCHASE">Entrada Avulsa sem NF</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantidade a Movimentar * (+ para entrada, - para saída)
                </label>
                <input
                  type="number"
                  name="quantity"
                  required
                  placeholder="Ex: 5 ou -2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Informe valor positivo para adicionar itens ou negativo para subtrair.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justificativa / Observações
                </label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Ex: Contagem física semanal, avaria na embalagem..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                  Confirmar Movimentação
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
