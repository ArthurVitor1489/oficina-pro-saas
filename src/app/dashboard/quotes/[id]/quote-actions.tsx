"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Wrench, Send, XCircle, ArrowRight, Loader2 } from "lucide-react";
import { updateQuoteStatusAction, convertQuoteToWorkOrderAction } from "@/features/quotes/actions";
import { Button } from "@/components/ui/Button";
import { QuoteStatus } from "@/db/schema/quotes";

interface QuoteActionsProps {
  quoteId: string;
  currentStatus: QuoteStatus;
  convertedToWorkOrderId?: string | null;
  customerPhone?: string | null;
  customerName: string;
  quoteNumber: number;
  totalFormatted: string;
  vehiclePlate?: string | null;
}

export function QuoteActionControls({
  quoteId,
  currentStatus,
  convertedToWorkOrderId,
  customerPhone,
  customerName,
  quoteNumber,
  totalFormatted,
  vehiclePlate,
}: QuoteActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cleanPhone = customerPhone?.replace(/\D/g, "");

  const handleStatusChange = (newStatus: QuoteStatus) => {
    setError(null);
    startTransition(async () => {
      const res = await updateQuoteStatusAction(quoteId, newStatus);
      if (res?.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleConvertToWorkOrder = () => {
    setError(null);
    startTransition(async () => {
      const res = await convertQuoteToWorkOrderAction(quoteId);
      if (res?.error) {
        setError(res.error);
      } else if (res?.workOrderId) {
        router.push(`/dashboard/work-orders/${res.workOrderId}`);
      }
    });
  };

  // WhatsApp share link
  const whatsappMessage = encodeURIComponent(
    `Olá ${customerName}! Segue o orçamento #${quoteNumber} para o veículo ${
      vehiclePlate || ""
    } no valor de ${totalFormatted}.\nPodemos aprovar para iniciar os serviços?`
  );
  const whatsappUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${whatsappMessage}`
    : null;

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* Enviar via WhatsApp */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              if (currentStatus === "DRAFT") {
                handleStatusChange("SENT");
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar WhatsApp</span>
          </a>
        )}

        {/* Marcar como Aprovado */}
        {currentStatus !== "APPROVED" && currentStatus !== "CONVERTED" && (
          <Button
            variant="outline"
            size="sm"
            isLoading={isPending}
            onClick={() => handleStatusChange("APPROVED")}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          >
            Aprovar Orçamento
          </Button>
        )}

        {/* Transformar em Ordem de Serviço */}
        {currentStatus !== "CONVERTED" && (
          <Button
            variant="primary"
            size="sm"
            isLoading={isPending}
            onClick={handleConvertToWorkOrder}
            leftIcon={<Wrench className="w-4 h-4 text-white" />}
          >
            Transformar em OS
          </Button>
        )}

        {/* Se já foi convertido */}
        {currentStatus === "CONVERTED" && convertedToWorkOrderId && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/dashboard/work-orders/${convertedToWorkOrderId}`)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Ver Ordem de Serviço Gerada
          </Button>
        )}
      </div>
    </div>
  );
}
