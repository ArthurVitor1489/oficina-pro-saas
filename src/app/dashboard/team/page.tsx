import React from "react";
import { getTenantContext } from "@/lib/server/tenant-context";
import { hasPermission } from "@/lib/server/rbac";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { Card, CardHeader } from "@/components/ui/Card";
import { RoleBadge, Badge } from "@/components/ui/Badge";
import { ShieldCheck, Users, Mail, CheckCircle2 } from "lucide-react";
import { AddTeamMemberModal } from "./add-member-modal";

export default async function TeamPage() {
  const { companyId, user } = await getTenantContext();

  const isOwnerOrAdmin = hasPermission(user.role, "manage:users");

  // Buscar todos os usuários pertencentes a este tenant
  const teamMembers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.companyId, companyId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" />
            Gestão da Equipe & Permissões (RBAC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Controle os colaboradores da oficina e suas atribuições de acesso.
          </p>
        </div>

        {isOwnerOrAdmin && <AddTeamMemberModal />}
      </div>

      {/* Lista de Colaboradores */}
      <Card padding="none">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <CardHeader
            title={`Membros da Oficina (${teamMembers.length})`}
            subtitle="Usuários vinculados a este tenant"
            className="mb-0"
          />
        </div>

        {/* Tabela Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 sm:px-6">Nome</th>
                <th className="py-3 px-4 sm:px-6">E-mail</th>
                <th className="py-3 px-4 sm:px-6">Perfil (Role)</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{member.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-600 font-mono text-xs">
                    {member.email}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    {member.active ? (
                      <Badge variant="success">Ativo</Badge>
                    ) : (
                      <Badge variant="danger">Inativo</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Guia de Permissões RBAC */}
      <Card>
        <CardHeader
          title="Matriz de Papéis e Permissões do Sistema"
          subtitle="Segurança em nível de servidor aplicada automaticamente"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-1.5 mb-1.5 font-bold text-slate-900">
              <RoleBadge role="OWNER" />
              <span>Proprietário</span>
            </div>
            <p className="text-slate-600">
              Acesso irrestrito a configurações da empresa, usuários, financeiro, relatórios e auditoria.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-1.5 mb-1.5 font-bold text-slate-900">
              <RoleBadge role="ADMIN" />
              <span>Administrador</span>
            </div>
            <p className="text-slate-600">
              Gerencia equipe, clientes, veículos, ordens de serviço, orçamentos, compras e financeiro.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-1.5 mb-1.5 font-bold text-slate-900">
              <RoleBadge role="MANAGER" />
              <span>Gerente</span>
            </div>
            <p className="text-slate-600">
              Gerencia estoque, compras, clientes e fluxo diário de ordens de serviço e orçamentos.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-1.5 mb-1.5 font-bold text-slate-900">
              <RoleBadge role="ATTENDANT" />
              <span>Atendente</span>
            </div>
            <p className="text-slate-600">
              Recepção, abertura de orçamentos, atendimento e cadastro de clientes e veículos.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-1.5 mb-1.5 font-bold text-slate-900">
              <RoleBadge role="MECHANIC" />
              <span>Mecânico / Técnico</span>
            </div>
            <p className="text-slate-600">
              Visão mobile no box: visualiza OS, atualiza status, adiciona peças e fotos aos serviços.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-1.5 mb-1.5 font-bold text-slate-900">
              <RoleBadge role="FINANCE" />
              <span>Financeiro</span>
            </div>
            <p className="text-slate-600">
              Contas a pagar, contas a receber, fluxo de caixa e conciliação de pagamentos das OS.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
