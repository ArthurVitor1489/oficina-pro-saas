import React from "react";
import Link from "next/link";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { vehicles } from "@/db/schema/vehicles";
import { customers } from "@/db/schema/customers";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { Car, Gauge, Fuel, ArrowRight } from "lucide-react";
import { VehicleModal } from "./vehicle-modal";

export default async function VehiclesPage() {
  const { companyId } = await getTenantContext();

  const [tenantVehicles, tenantCustomers] = await Promise.all([
    db
      .select({
        id: vehicles.id,
        plate: vehicles.plate,
        brand: vehicles.brand,
        model: vehicles.model,
        year: vehicles.year,
        version: vehicles.version,
        fuelType: vehicles.fuelType,
        mileage: vehicles.mileage,
        customerId: vehicles.customerId,
        customerName: customers.name,
      })
      .from(vehicles)
      .leftJoin(customers, eq(vehicles.customerId, customers.id))
      .where(eq(vehicles.companyId, companyId))
      .orderBy(desc(vehicles.createdAt)),

    db
      .select({
        id: customers.id,
        name: customers.name,
      })
      .from(customers)
      .where(eq(customers.companyId, companyId)),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-sky-600" />
            Frota e Veículos ({tenantVehicles.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Controle de histórico por placa, quilometragem e proprietário.
          </p>
        </div>

        <VehicleModal customers={tenantCustomers} />
      </div>

      {tenantVehicles.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhum veículo cadastrado</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Cadastre os veículos dos seus clientes para manter o histórico de revisões e serviços organizados.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenantVehicles.map((veh) => (
            <Card key={veh.id} className="hover:border-sky-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-mono font-black text-xs px-2.5 py-1 bg-slate-900 text-white rounded tracking-wider">
                    {veh.plate}
                  </span>
                  <span className="text-xs text-slate-500">{veh.year || "Ano N/A"}</span>
                </div>

                <div className="mt-3">
                  <Link
                    href={`/dashboard/vehicles/${veh.id}`}
                    className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors block"
                  >
                    {veh.brand} {veh.model}
                  </Link>
                  {veh.version && <p className="text-xs text-slate-500">{veh.version}</p>}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Proprietário:</span>
                    <Link
                      href={`/dashboard/customers/${veh.customerId}`}
                      className="font-semibold text-slate-800 hover:text-sky-600"
                    >
                      {veh.customerName || "N/A"}
                    </Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Quilometragem:</span>
                    <span className="font-mono font-medium">{veh.mileage?.toLocaleString("pt-BR")} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Combustível:</span>
                    <span className="font-medium text-slate-700">{veh.fuelType || "FLEX"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <Link
                  href={`/dashboard/vehicles/${veh.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  <span>Histórico do Veículo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
