"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SettleModal } from "./settle-modal";
import { cancelTransactionAction } from "@/features/finance/actions";
import { Ban, Loader2 } from "lucide-react";

interface TransactionRowActionsProps {
  transaction: {
    id: string;
    description: string;
    type: "RECEIVABLE" | "PAYABLE";
    status: string;
    amountCents: number;
    paymentMethod: string | null;
  };
}

export function TransactionRowActions({ transaction }: TransactionRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formattedAmount = (transaction.amountCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const handleCancel = () => {
    if (!confirm(`Deseja realmente cancelar este lançamento ("${transaction.description}")?`)) {
      return;
    }

    startTransition(async () => {
      const res = await cancelTransactionAction(transaction.id);
      if (res?.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    });
  };

  if (transaction.status === "PAID") {
    return (
      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
        Quitado
      </span>
    );
  }

  if (transaction.status === "CANCELED") {
    return (
      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
        Cancelado
      </span>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <SettleModal
        transactionId={transaction.id}
        description={transaction.description}
        type={transaction.type}
        amountFormatted={formattedAmount}
        defaultMethod={transaction.paymentMethod}
      />

      <button
        type="button"
        disabled={isPending}
        onClick={handleCancel}
        title="Cancelar lançamento"
        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
        ) : (
          <Ban className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
