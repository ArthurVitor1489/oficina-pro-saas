"use server";

import { redirect } from "next/navigation";
import { loginUser, logoutUser, registerCompanyWithOwner } from "@/lib/server/auth";
import { headers } from "next/headers";

export async function loginAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Por favor, preencha o e-mail e a senha." };
  }

  const reqHeaders = await headers();
  const ip =
    reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() ||
    reqHeaders.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  const result = await loginUser(email, password, ip, userAgent);

  if (!result.success) {
    return { error: result.error || "Erro ao realizar login." };
  }

  redirect("/dashboard");
}

export async function registerAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const companyName = formData.get("companyName") as string;
  const tradeName = formData.get("tradeName") as string;
  const document = formData.get("document") as string;
  const phone = formData.get("phone") as string;
  const ownerName = formData.get("ownerName") as string;
  const ownerEmail = formData.get("ownerEmail") as string;
  const ownerPassword = formData.get("ownerPassword") as string;

  if (!companyName || !document || !ownerName || !ownerEmail || !ownerPassword) {
    return { error: "Preencha todos os campos obrigatórios marcados com asterisco (*)." };
  }

  if (ownerPassword.length < 6) {
    return { error: "A senha deve ter no mínimo 6 caracteres." };
  }

  const reqHeaders = await headers();
  const ip =
    reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() ||
    reqHeaders.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  const result = await registerCompanyWithOwner({
    companyName,
    tradeName,
    document,
    phone,
    ownerName,
    ownerEmail,
    ownerPassword,
    ip,
    userAgent,
  });

  if (!result.success) {
    return { error: result.error || "Erro ao cadastrar empresa." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await logoutUser();
  redirect("/login");
}
