import React from "react";
import Link from "next/link";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { Users, Phone, Mail, MapPin, Car, ArrowRight } from "lucide-react";
import { CustomerModal } from "./customer-modal";

export default async function CustomersPage() {
  const { companyId } = await getTenantContext();

  const [tenantCustomers, tenantVehicles] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(eq(customers.companyId, companyId))
      .orderBy(desc(customers.createdAt)),

    db
      .select()
      .from(vehicles)
      .where(eq(vehicles.companyId, companyId)),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" />
            Clientes Cadastrados ({tenantCustomers.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Base de clientes e proprietários de veículos vinculados à sua oficina.
          </p>
        </div>

        <CustomerModal />
      </div>

      {tenantCustomers.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhum cliente cadastrado</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Cadastre seu primeiro cliente para vincular veículos, gerar orçamentos e abrir ordens de serviço.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenantCustomers.map((cust) => {
            const custVehicles = tenantVehicles.filter((v) => v.customerId === cust.id);
            return (
              <Card key={cust.id} className="hover:border-sky-300 transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/dashboard/customers/${cust.id}`}
                        className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors block"
                      >
                        {cust.name}
                      </Link>
                      <span className="text-xs font-mono text-slate-500">
                        {cust.document || "Sem CPF/CNPJ"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded-md font-semibold">
                      <Car className="w-3.5 h-3.5" />
                      <span>{custVehicles.length} veículo(s)</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    {(cust.whatsapp || cust.phone) && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust.whatsapp || cust.phone}</span>
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
                        <span>
                          {cust.city} - {cust.state || "UF"}
                        </span>
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
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <Link
                    href={`/dashboard/customers/${cust.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
                  >
                    <span>Ver Perfil & Histórico</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
