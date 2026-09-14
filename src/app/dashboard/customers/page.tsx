import React from "react";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { eq } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Users, Phone, Mail, MapPin, PlusCircle, Car } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function CustomersPage() {
  const { companyId } = await getTenantContext();

  // Buscar clientes e veículos do tenant
  const tenantCustomers = await db
    .select()
    .from(customers)
    .where(eq(customers.companyId, companyId));

  const tenantVehicles = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.companyId, companyId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" />
            Clientes Cadastrados
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Base de clientes e proprietários de veículos vinculados à sua oficina.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tenantCustomers.map((cust) => {
          const custVehicles = tenantVehicles.filter((v) => v.customerId === cust.id);
          return (
            <Card key={cust.id} className="hover:border-sky-300 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{cust.name}</h3>
                  <span className="text-xs font-mono text-slate-500">{cust.document || "Sem CPF/CNPJ"}</span>
                </div>
                <div className="flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded-md font-semibold">
                  <Car className="w-3.5 h-3.5" />
                  <span>{custVehicles.length} veículo(s)</span>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                {cust.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.phone}</span>
                  </div>
                )}
                {cust.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.email}</span>
                  </div>
                )}
                {cust.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.city} - {cust.state}</span>
                  </div>
                )}
              </div>

              {custVehicles.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {custVehicles.map((v) => (
                    <span
                      key={v.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold"
                    >
                      🚗 {v.plate} ({v.brand} {v.model})
                    </span>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
