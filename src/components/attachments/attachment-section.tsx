"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  Upload,
  Trash2,
  ExternalLink,
  Loader2,
  Paperclip,
} from "lucide-react";
import { uploadAttachmentAction, deleteAttachmentAction } from "@/features/attachments/actions";
import { Attachment, AttachmentEntityType } from "@/db/schema/attachments";
import { Button } from "@/components/ui/Button";

interface AttachmentSectionProps {
  entityType: AttachmentEntityType;
  entityId: string;
  initialAttachments?: Attachment[];
  title?: string;
  allowUpload?: boolean;
}

export function AttachmentSection({
  entityType,
  entityId,
  initialAttachments = [],
  title = "Anexos, Fotos & Documentos",
  allowUpload = true,
}: AttachmentSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setError(null);
    const formData = new FormData();
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);
    formData.append("file", selectedFile);

    startTransition(async () => {
      const res = await uploadAttachmentAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSelectedFile(null);
        router.refresh();
      }
    });
  };

  const handleDelete = (attachmentId: string, fileName: string) => {
    if (!confirm(`Deseja realmente remover o anexo "${fileName}"?`)) return;

    startTransition(async () => {
      const res = await deleteAttachmentAction(attachmentId);
      if (res?.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isImage = (fileType: string) => fileType.startsWith("image/");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-sky-600" />
          {title} ({initialAttachments.length})
        </h3>
      </div>

      {error && (
        <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Upload Box */}
      {allowUpload && (
        <form onSubmit={handleUpload} className="mt-4 flex flex-wrap items-center gap-2">
          <label className="flex-1 min-w-[200px] cursor-pointer">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <div className="border border-dashed border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-600 hover:border-sky-500 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <span className="truncate">
                {selectedFile ? selectedFile.name : "Clique para selecionar foto ou documento..."}
              </span>
              <Upload className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </div>
          </label>

          <Button
            type="submit"
            size="sm"
            disabled={!selectedFile || isPending}
            isLoading={isPending}
            variant="primary"
          >
            Anexar
          </Button>
        </form>
      )}

      {/* Galeria de Anexos */}
      {initialAttachments.length === 0 ? (
        <p className="mt-4 text-xs text-slate-400 text-center py-4">
          Nenhum arquivo ou foto anexada.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {initialAttachments.map((att) => {
            const isImg = isImage(att.fileType);
            return (
              <div
                key={att.id}
                className="group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col justify-between hover:shadow-xs transition-shadow"
              >
                {isImg ? (
                  <div className="h-28 bg-slate-200 overflow-hidden relative">
                    <img
                      src={att.storageKey}
                      alt={att.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="h-28 flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                    <FileText className="w-10 h-10 text-slate-400" />
                    <span className="text-[10px] uppercase font-bold mt-1 text-slate-500">
                      {att.fileName.split(".").pop() || "DOC"}
                    </span>
                  </div>
                )}

                <div className="p-2 bg-white border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-800 truncate" title={att.fileName}>
                    {att.fileName}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatBytes(att.fileSize)} • {new Date(att.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  <a
                    href={att.storageKey}
                    target="_blank"
                    rel="noreferrer"
                    download={att.fileName}
                    title="Baixar ou visualizar"
                    className="p-1 bg-white/90 hover:bg-white text-slate-700 rounded-md shadow-2xs backdrop-blur-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {allowUpload && (
                    <button
                      type="button"
                      onClick={() => handleDelete(att.id, att.fileName)}
                      title="Excluir arquivo"
                      className="p-1 bg-white/90 hover:bg-white text-rose-600 rounded-md shadow-2xs backdrop-blur-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
