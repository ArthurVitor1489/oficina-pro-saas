import React from "react";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/server/tenant-context";
import { DashboardNavigation } from "./navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let context;
  try {
    context = await getTenantContext();
  } catch (error: any) {
    // Redireciona para o login se não autenticado ou suspenso
    redirect("/login");
  }

  return (
    <DashboardNavigation user={context.user} company={context.company}>
      {children}
    </DashboardNavigation>
  );
}
