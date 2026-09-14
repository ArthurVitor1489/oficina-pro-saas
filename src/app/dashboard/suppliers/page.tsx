import React from "react";
import { getTenantContext } from "@/lib/server/tenant-context";
import { db } from "@/db";
import { suppliers } from "@/db/schema/suppliers";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { Truck, Phone, Mail, MapPin } from "lucide-react";
import { SupplierModal } from "./supplier-modal";

export default async function SuppliersPage() {
  const { companyId } = await getTenantContext();

  const suppliersList = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.companyId, companyId))
    .orderBy(desc(suppliers.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-600" />
            Fornecedores de Peças ({suppliersList.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Distribuidores de autopeças e parceiros comerciais homologados da oficina.
          </p>
        </div>

        <SupplierModal />
      </div>

      {suppliersList.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhum fornecedor cadastrado</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Cadastre distribuidores para vincular a compras de peças e controle de preços.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliersList.map((supp) => (
            <Card key={supp.id} className="hover:border-sky-300 transition-colors">
              <div>
                <h3 className="text-base font-bold text-slate-900">{supp.legalName}</h3>
                {supp.tradeName && supp.tradeName !== supp.legalName && (
                  <p className="text-xs font-semibold text-sky-600">{supp.tradeName}</p>
                )}
                <span className="text-xs font-mono text-slate-500">
                  CNPJ: {supp.document || "Não informado"}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                {(supp.whatsapp || supp.phone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{supp.whatsapp || supp.phone}</span>
                  </div>
                )}
                {supp.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{supp.email}</span>
                  </div>
                )}
                {supp.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {supp.city} - {supp.state || "UF"}
                    </span>
                  </div>
                )}
              </div>

              {supp.notes && (
                <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-200/80 text-[11px] text-slate-600">
                  {supp.notes}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
