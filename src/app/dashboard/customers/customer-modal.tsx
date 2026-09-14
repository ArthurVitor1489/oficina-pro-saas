"use client";

import React, { useState, useActionState, useEffect } from "react";
import { UserPlus, X, AlertCircle, Phone, Mail, MapPin, FileText, User } from "lucide-react";
import { createCustomerAction } from "@/features/customers/actions";
import { Button } from "@/components/ui/Button";

interface CustomerModalProps {
  onSuccess?: (customerId: string) => void;
}

export function CustomerModal({ onSuccess }: CustomerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createCustomerAction, null);

  useEffect(() => {
    if (state?.success && state.customerId) {
      setIsOpen(false);
      if (onSuccess) onSuccess(state.customerId);
    }
  }, [state?.success, state?.customerId, onSuccess]);

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setIsOpen(true)}
        leftIcon={<UserPlus className="w-4 h-4" />}
      >
        Novo Cliente
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Cliente</h3>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo ou Razão Social *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    name="document"
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Comercial
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone Fixo / Recado
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="(11) 3333-3333"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="cliente@email.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Endereço (Rua, Número, Bairro)
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Rua das Flores, 120 - Centro"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

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

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações Gerais
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Preferências do cliente, restrições ou histórico..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
                  />
                </div>
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
                  Salvar Cliente
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
