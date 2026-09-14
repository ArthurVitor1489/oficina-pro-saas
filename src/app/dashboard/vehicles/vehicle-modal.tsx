"use client";

import React, { useState, useActionState, useEffect } from "react";
import { PlusCircle, X, AlertCircle, Car, User, Gauge } from "lucide-react";
import { createVehicleAction } from "@/features/vehicles/actions";
import { Button } from "@/components/ui/Button";

interface CustomerOption {
  id: string;
  name: string;
}

interface VehicleModalProps {
  customers: CustomerOption[];
  defaultCustomerId?: string;
  onSuccess?: () => void;
}

export function VehicleModal({ customers, defaultCustomerId, onSuccess }: VehicleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createVehicleAction, null);

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
      if (onSuccess) onSuccess();
    }
  }, [state?.success, onSuccess]);

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setIsOpen(true)}
        leftIcon={<PlusCircle className="w-4 h-4" />}
      >
        Novo Veículo
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Cadastrar Veículo</h3>
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
                  Proprietário / Cliente *
                </label>
                <select
                  name="customerId"
                  required
                  defaultValue={defaultCustomerId || ""}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Selecione um cliente cadastrado...
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
                    Placa do Veículo *
                  </label>
                  <input
                    type="text"
                    name="plate"
                    required
                    placeholder="ABC-1234 ou BRA2E19"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quilometragem (KM)
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    placeholder="Ex: 65000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marca / Fabricante *
                  </label>
                  <input
                    type="text"
                    name="brand"
                    required
                    placeholder="Ex: Volkswagen, Fiat, Ford"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    name="model"
                    required
                    placeholder="Ex: Gol, Civic, Corolla"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ano / Modelo
                  </label>
                  <input
                    type="number"
                    name="year"
                    placeholder="Ex: 2021"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Combustível
                  </label>
                  <select
                    name="fuelType"
                    defaultValue="FLEX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="FLEX">Flex (Etanol / Gasolina)</option>
                    <option value="GASOLINA">Gasolina</option>
                    <option value="ETANOL">Etanol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="ELETRICO">Elétrico</option>
                    <option value="HIBRIDO">Híbrido</option>
                    <option value="GNV">GNV</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Versão / Motorização
                  </label>
                  <input
                    type="text"
                    name="version"
                    placeholder="Ex: 1.0 Flex Manual, 2.0 TSI Automático"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações Técnicas do Veículo
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Histórico de manutenções anteriores, avarias pré-existentes..."
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
                  Salvar Veículo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
