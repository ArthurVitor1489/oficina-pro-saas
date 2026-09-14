import React from "react";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { vehicles } from "@/db/schema/vehicles";
import { customers } from "@/db/schema/customers";
import { eq } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Car, PlusCircle, Gauge, Fuel } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function VehiclesPage() {
  const { companyId } = await getTenantContext();

  const tenantVehicles = await db
    .select({
      id: vehicles.id,
      plate: vehicles.plate,
      brand: vehicles.brand,
      model: vehicles.model,
      year: vehicles.year,
      version: vehicles.version,
      fuelType: vehicles.fuelType,
      mileage: vehicles.mileage,
      customerName: customers.name,
    })
    .from(vehicles)
    .leftJoin(customers, eq(vehicles.customerId, customers.id))
    .where(eq(vehicles.companyId, companyId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-sky-600" />
            Frota e Veículos dos Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Controle de histórico por placa, quilometragem e proprietário.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Novo Veículo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenantVehicles.map((veh) => (
          <Card key={veh.id} className="hover:border-sky-300 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-mono font-black text-sm px-2.5 py-1 bg-slate-900 text-white rounded border border-slate-700 tracking-wider">
                {veh.plate}
              </span>
              <span className="text-xs text-slate-500">{veh.year || "Ano N/A"}</span>
            </div>

            <div className="mt-3">
              <h3 className="text-base font-bold text-slate-900">
                {veh.brand} {veh.model}
              </h3>
              {veh.version && <p className="text-xs text-slate-500">{veh.version}</p>}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Proprietário:</span>
                <span className="font-semibold text-slate-800">{veh.customerName || "N/A"}</span>
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
          </Card>
        ))}
      </div>
    </div>
  );
}
