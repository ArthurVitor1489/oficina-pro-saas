"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, X, AlertCircle } from "lucide-react";
import { settleTransactionAction } from "@/features/finance/actions";
import { Button } from "@/components/ui/Button";

interface SettleModalProps {
  transactionId: string;
  description: string;
  type: "RECEIVABLE" | "PAYABLE";
  amountFormatted: string;
  defaultMethod?: string | null;
}

export function SettleModal({
  transactionId,
  description,
  type,
  amountFormatted,
  defaultMethod,
}: SettleModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(defaultMethod || "PIX");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSettle = () => {
    setError(null);
    startTransition(async () => {
      const res = await settleTransactionAction(transactionId, paymentMethod);
      if (res?.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
      >
        {type === "RECEIVABLE" ? "Receber" : "Pagar"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {type === "RECEIVABLE" ? "Confirmar Recebimento" : "Confirmar Pagamento"}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {error && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {error}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Título:</span>
                <span className="font-bold text-slate-800 block text-sm">{description}</span>
                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500">Valor a Liquidar:</span>
                  <span className="font-black text-slate-900 text-base">{amountFormatted}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Forma de Pagamento Efetiva *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="PIX">PIX</option>
                  <option value="DINHEIRO">Dinheiro em Espécie</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="TRANSFERENCIA">Transferência Bancária</option>
                </select>
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
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isPending}
                  onClick={handleSettle}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Confirmar Baixa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
