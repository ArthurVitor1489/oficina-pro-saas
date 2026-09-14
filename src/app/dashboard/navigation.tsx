"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  FileText,
  Users,
  Car,
  Package,
  Settings,
  DollarSign,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  ShoppingBag,
  History,
  Building,
  Truck,
} from "lucide-react";
import { RoleBadge } from "@/components/ui/Badge";
import { logoutAction } from "@/features/auth/actions";
import { SafeUser } from "@/db/schema/users";
import { Company } from "@/db/schema/companies";

interface NavigationProps {
  user: SafeUser;
  company: Company;
  children: React.ReactNode;
}

export function DashboardNavigation({ user, company, children }: NavigationProps) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Regras de visibilidade no menu por role
  const isOwnerOrAdmin = user.role === "OWNER" || user.role === "ADMIN";
  const canSeeFinance = isOwnerOrAdmin || user.role === "FINANCE";
  const isMechanic = user.role === "MECHANIC";

  const navItems = [
    {
      label: "Visão Geral",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: "Ordens de Serviço",
      href: "/dashboard/work-orders",
      icon: Wrench,
      show: true,
    },
    {
      label: "Orçamentos",
      href: "/dashboard/quotes",
      icon: FileText,
      show: !isMechanic,
    },
    {
      label: "Clientes",
      href: "/dashboard/customers",
      icon: Users,
      show: true,
    },
    {
      label: "Veículos",
      href: "/dashboard/vehicles",
      icon: Car,
      show: true,
    },
    {
      label: "Peças & Estoque",
      href: "/dashboard/inventory",
      icon: Package,
      show: true,
    },
    {
      label: "Catálogo Serviços",
      href: "/dashboard/services",
      icon: Settings,
      show: true,
    },
    {
      label: "Compras",
      href: "/dashboard/purchases",
      icon: ShoppingBag,
      show: !isMechanic,
    },
    {
      label: "Fornecedores",
      href: "/dashboard/suppliers",
      icon: Truck,
      show: !isMechanic,
    },
    {
      label: "Financeiro",
      href: "/dashboard/finance",
      icon: DollarSign,
      show: canSeeFinance,
    },
    {
      label: "Equipe & Acessos",
      href: "/dashboard/team",
      icon: ShieldCheck,
      show: isOwnerOrAdmin,
    },
    {
      label: "Trilha de Auditoria",
      href: "/dashboard/audit",
      icon: History,
      show: isOwnerOrAdmin,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-slate-900 tracking-tight text-base block leading-none">
                  Oficina<span className="text-sky-600">Pro</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium leading-tight">
                  Multi-Tenant SaaS
                </span>
              </div>
            </Link>

            {/* Separator */}
            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1" />

            {/* Tenant badge indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md">
              <Building className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px] sm:max-w-[200px]">
                {company.tradeName || company.name}
              </span>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                {user.name}
              </span>
              <div className="mt-0.5">
                <RoleBadge role={user.role} />
              </div>
            </div>

            <div className="sm:hidden">
              <RoleBadge role={user.role} />
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Sair do sistema"
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 py-6 pr-6 border-r border-slate-200">
          <div className="sticky top-24 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Navegação Principal
            </div>

            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${
                        isActive
                          ? "bg-sky-600 text-white shadow-sm font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white"
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />

            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 py-5 px-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">OficinaPro</span>
                    <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                      {company.tradeName || company.name}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-1">
                {navItems
                  .filter((item) => item.show)
                  .map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`
                          flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all
                          ${
                            isActive
                              ? "bg-sky-600 text-white font-semibold"
                              : "text-slate-700 hover:bg-slate-50"
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="mb-3 px-2">
                  <span className="text-xs font-bold text-slate-800 block">{user.name}</span>
                  <span className="text-xs text-slate-400 block">{user.email}</span>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Oficina</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 pb-20 lg:pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 shadow-lg">
        <div className="grid grid-cols-5 gap-1 text-center">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center py-1.5 px-1 rounded-md text-[10px] font-medium ${
              pathname === "/dashboard" ? "text-sky-600 font-bold" : "text-slate-500"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Início</span>
          </Link>

          <Link
            href="/dashboard/work-orders"
            className={`flex flex-col items-center py-1.5 px-1 rounded-md text-[10px] font-medium ${
              pathname === "/dashboard/work-orders" ? "text-sky-600 font-bold" : "text-slate-500"
            }`}
          >
            <Wrench className="w-5 h-5 mb-0.5" />
            <span>OS</span>
          </Link>

          <Link
            href="/dashboard/quotes"
            className={`flex flex-col items-center py-1.5 px-1 rounded-md text-[10px] font-medium ${
              pathname === "/dashboard/quotes" ? "text-sky-600 font-bold" : "text-slate-500"
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span>Orçamentos</span>
          </Link>

          <Link
            href="/dashboard/customers"
            className={`flex flex-col items-center py-1.5 px-1 rounded-md text-[10px] font-medium ${
              pathname === "/dashboard/customers" ? "text-sky-600 font-bold" : "text-slate-500"
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span>Clientes</span>
          </Link>

          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="flex flex-col items-center py-1.5 px-1 rounded-md text-[10px] font-medium text-slate-500"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>Mais</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
