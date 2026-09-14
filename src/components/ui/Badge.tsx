import React from "react";
import { UserRole } from "@/db/schema/users";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    neutral: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: UserRole | string }) {
  const roleConfig: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    OWNER: { label: "Proprietário", variant: "purple" },
    ADMIN: { label: "Administrador", variant: "info" },
    MANAGER: { label: "Gerente", variant: "warning" },
    ATTENDANT: { label: "Atendente", variant: "default" },
    MECHANIC: { label: "Mecânico", variant: "success" },
    FINANCE: { label: "Financeiro", variant: "danger" },
  };

  const config = roleConfig[role] || { label: role, variant: "neutral" };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    ACTIVE: { label: "Ativo", variant: "success" },
    SUSPENDED: { label: "Suspenso", variant: "warning" },
    CANCELED: { label: "Cancelado", variant: "danger" },
    OPEN: { label: "Aberta", variant: "info" },
    IN_PROGRESS: { label: "Em Execução", variant: "warning" },
    WAITING_PART: { label: "Aguardando Peça", variant: "purple" },
    FINISHED: { label: "Finalizada", variant: "success" },
    DELIVERED: { label: "Entregue", variant: "default" },
  };

  const config = statusConfig[status] || { label: status, variant: "neutral" };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
