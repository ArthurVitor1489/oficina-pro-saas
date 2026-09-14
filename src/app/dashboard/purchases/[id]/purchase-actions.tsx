"use client";

import React, { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { confirmPurchaseAction } from "@/features/purchases/actions";
import { Button } from "@/components/ui/Button";

export function PurchaseActionControls({
  purchaseId,
  isConfirmed,
}: {
  purchaseId: string;
  isConfirmed: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await confirmPurchaseAction(purchaseId);
      if (res?.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  if (isConfirmed) {
    return (
      <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-bold">
        <CheckCircle2 className="w-4 h-4" />
        <span>Estoque & Contas a Pagar Atualizados</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        variant="primary"
        size="sm"
        isLoading={isPending}
        onClick={handleConfirm}
        leftIcon={<CheckCircle2 className="w-4 h-4" />}
      >
        Confirmar Entrada de Estoque
      </Button>
    </div>
  );
}
