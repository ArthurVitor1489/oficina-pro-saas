"use client";

import React, { useState, useActionState, useEffect } from "react";
import { PlusCircle, X, Wrench, AlertCircle, User, Car } from "lucide-react";
import { createWorkOrderAction } from "@/features/work-orders/actions";
import { Button } from "@/components/ui/Button";

interface CustomerOption {
  id: string;
  name: string;
}

interface VehicleOption {
  id: string;
  customerId: string;
  plate: string;
  model: string;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
}

interface WorkOrderModalProps {
  customers: CustomerOption[];
  vehicles: VehicleOption[];
  technicians: UserOption[];
  defaultCustomerId?: string;
  defaultVehicleId?: string;
}

export function WorkOrderModal({
  customers,
  vehicles,
  technicians,
  defaultCustomerId,
  defaultVehicleId,
}: WorkOrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createWorkOrderAction, null);

  const [selectedCustomerId, setSelectedCustomerId] = useState(defaultCustomerId || "");
  const [selectedVehicleId, setSelectedVehicleId] = useState(defaultVehicleId || "");

  const customerVehicles = vehicles.filter((v) => v.customerId === selectedCustomerId);

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
      setSelectedCustomerId("");
      setSelectedVehicleId("");
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
        Nova Ordem de Serviço
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Abrir Ordem de Serviço</h3>
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
                  Cliente da Oficina *
                </label>
                <select
                  name="customerId"
                  required
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setSelectedVehicleId("");
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Selecione o cliente...
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Veículo
                  </label>
                  <select
                    name="vehicleId"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    disabled={!selectedCustomerId || customerVehicles.length === 0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {customerVehicles.length === 0
                        ? "Nenhum veículo cadastrado"
                        : "Selecione o veículo..."}
                    </option>
                    {customerVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} - {v.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mecânico Responsável
                  </label>
                  <select
                    name="assignedUserId"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">Nenhum (Atribuir depois)</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sintomas Relatados pelo Cliente / Queixa
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Ex: Barulho na suspensão dianteira ao frear, luz de injeção acesa..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnóstico Técnico Inicial (Uso Interno)
                </label>
                <textarea
                  name="internalNotes"
                  rows={2}
                  placeholder="Ex: Teste de rodagem realizado, folga no pivô direito constatada..."
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
                  Abrir Ordem de Serviço
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
