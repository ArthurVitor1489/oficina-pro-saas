import { UserRole } from "@/db/schema/users";
export type { UserRole };

export type Permission =
  | "manage:company"
  | "manage:users"
  | "manage:roles"
  | "view:audit_logs"
  | "view:finance"
  | "manage:finance"
  | "view:purchases"
  | "manage:purchases"
  | "view:inventory"
  | "manage:inventory"
  | "view:customers"
  | "manage:customers"
  | "view:vehicles"
  | "manage:vehicles"
  | "view:services"
  | "manage:services"
  | "view:quotes"
  | "manage:quotes"
  | "view:work_orders"
  | "manage:work_orders"
  | "update_status:work_orders"
  | "add_items:work_orders";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    "manage:company",
    "manage:users",
    "manage:roles",
    "view:audit_logs",
    "view:finance",
    "manage:finance",
    "view:purchases",
    "manage:purchases",
    "view:inventory",
    "manage:inventory",
    "view:customers",
    "manage:customers",
    "view:vehicles",
    "manage:vehicles",
    "view:services",
    "manage:services",
    "view:quotes",
    "manage:quotes",
    "view:work_orders",
    "manage:work_orders",
    "update_status:work_orders",
    "add_items:work_orders",
  ],
  ADMIN: [
    "manage:users",
    "view:audit_logs",
    "view:finance",
    "manage:finance",
    "view:purchases",
    "manage:purchases",
    "view:inventory",
    "manage:inventory",
    "view:customers",
    "manage:customers",
    "view:vehicles",
    "manage:vehicles",
    "view:services",
    "manage:services",
    "view:quotes",
    "manage:quotes",
    "view:work_orders",
    "manage:work_orders",
    "update_status:work_orders",
    "add_items:work_orders",
  ],
  MANAGER: [
    "view:purchases",
    "manage:purchases",
    "view:inventory",
    "manage:inventory",
    "view:customers",
    "manage:customers",
    "view:vehicles",
    "manage:vehicles",
    "view:services",
    "manage:services",
    "view:quotes",
    "manage:quotes",
    "view:work_orders",
    "manage:work_orders",
    "update_status:work_orders",
    "add_items:work_orders",
  ],
  ATTENDANT: [
    "view:inventory",
    "view:customers",
    "manage:customers",
    "view:vehicles",
    "manage:vehicles",
    "view:services",
    "view:quotes",
    "manage:quotes",
    "view:work_orders",
    "manage:work_orders",
    "update_status:work_orders",
    "add_items:work_orders",
  ],
  MECHANIC: [
    "view:inventory",
    "view:customers",
    "view:vehicles",
    "view:services",
    "view:work_orders",
    "update_status:work_orders",
    "add_items:work_orders",
  ],
  FINANCE: [
    "view:finance",
    "manage:finance",
    "view:purchases",
    "view:inventory",
    "view:customers",
    "view:quotes",
    "view:work_orders",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function hasAnyRole(currentRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(currentRole);
}
