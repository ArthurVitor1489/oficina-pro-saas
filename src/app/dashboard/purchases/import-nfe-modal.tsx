"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileCode, UploadCloud, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { importNFeXmlAction } from "@/features/invoices/actions";
import { Button } from "@/components/ui/Button";

export function ImportNfeModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    invoiceNumber: string;
    supplierName: string;
    itemsCount: number;
    totalCents: number;
    purchaseId: string;
  } | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [xmlContent, setXmlContent] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessInfo(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xml")) {
      setError("Selecione um arquivo XML de NF-e válido.");
      return;
    }

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setXmlContent(content);
    };
    reader.onerror = () => {
      setError("Erro ao ler o arquivo XML.");
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!xmlContent) {
      setError("Selecione um arquivo XML de NF-e antes de continuar.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await importNFeXmlAction(xmlContent);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccessInfo({
          invoiceNumber: res.invoiceNumber!,
          supplierName: res.supplierName!,
          itemsCount: res.itemsCount!,
          totalCents: res.totalCents!,
          purchaseId: res.purchaseId!,
        });
        router.refresh();
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setSuccessInfo(null);
    setSelectedFileName(null);
    setXmlContent(null);
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        leftIcon={<FileCode className="w-4 h-4 text-sky-600" />}
      >
        Importar XML NF-e
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Importação Automática de NF-e</h3>
                  <p className="text-[11px] text-slate-500">
                    Entrada automática de peças no estoque e contas a pagar
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successInfo ? (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    NF-e Importada com Sucesso!
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs">
                    <p>
                      <strong className="text-emerald-950">Nota Fiscal:</strong> nº {successInfo.invoiceNumber}
                    </p>
                    <p>
                      <strong className="text-emerald-950">Fornecedor:</strong> {successInfo.supplierName}
                    </p>
                    <p>
                      <strong className="text-emerald-950">Itens Cadastrados/Atualizados:</strong> {successInfo.itemsCount} produtos
                    </p>
                    <p>
                      <strong className="text-emerald-950">Valor Total Faturado:</strong>{" "}
                      {(successInfo.totalCents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                  >
                    Fechar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      handleClose();
                      router.push(`/dashboard/purchases/${successInfo.purchaseId}`);
                    }}
                  >
                    Ver Compra Gerada
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-sky-500 transition-colors bg-slate-50/50">
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    Arraste ou selecione o arquivo XML da NF-e
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Formato aceito: XML padrão SEFAZ (distribuidoras e autopeças)
                  </p>

                  <label className="mt-3 inline-block">
                    <input
                      type="file"
                      accept=".xml,text/xml,application/xml"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs">
                      Selecionar Arquivo .XML
                    </span>
                  </label>

                  {selectedFileName && (
                    <div className="mt-3 text-xs font-semibold text-sky-700 bg-sky-50 py-1.5 px-3 rounded-md inline-block">
                      Arquivo selecionado: {selectedFileName}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-xs space-y-1">
                  <p className="font-bold text-slate-800">O que o sistema fará automaticamente:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    <li>Cadastra o fornecedor caso ainda não exista no sistema;</li>
                    <li>Cadastra ou atualiza o custo dos produtos/peças no catálogo;</li>
                    <li>Dá entrada nas quantidades no estoque com rastreabilidade total;</li>
                    <li>Lança a despesa a pagar no financeiro com vencimento em 30 dias;</li>
                    <li>Guarda o XML original anexo ao pedido de compra.</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={!xmlContent || isPending}
                    isLoading={isPending}
                    onClick={handleImport}
                  >
                    Importar e Processar NF-e
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
