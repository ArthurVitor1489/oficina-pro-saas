"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { Wrench, Shield, Mail, Lock, Sparkles, UserCheck, AlertCircle } from "lucide-react";
import { loginAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("senha123456");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-950 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              Oficina<span className="text-sky-400">Pro</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              SaaS MULTI-TENANT AUTOMOTIVO
            </p>
          </div>
        </div>

        <h2 className="text-center text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
          Acesse sua oficina
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-400">
          Gestão completa de ordens de serviço, clientes, estoque e finanças.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Demo Fast Access Selector */}
        <div className="mb-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Acesso Rápido de Demonstração</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Selecione um perfil para preencher credenciais automaticamente:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo("carlos@autocenter.com")}
              className="text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 transition-all text-xs"
            >
              <span className="font-semibold text-slate-200 block">Carlos (Dono)</span>
              <span className="text-[11px] text-sky-400 block">AutoCenter Pro (Acesso Total)</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo("marcos@autocenter.com")}
              className="text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition-all text-xs"
            >
              <span className="font-semibold text-slate-200 block">Marcos (Mecânico)</span>
              <span className="text-[11px] text-emerald-400 block">Visão Mobile para Box</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo("roberto@autocenter.com")}
              className="text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-rose-500/50 transition-all text-xs"
            >
              <span className="font-semibold text-slate-200 block">Roberto (Financeiro)</span>
              <span className="text-[11px] text-rose-400 block">Contas e Fluxo de Caixa</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo("joao@oficinadasilva.com")}
              className="text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 transition-all text-xs"
            >
              <span className="font-semibold text-slate-200 block">João (Outra Oficina)</span>
              <span className="text-[11px] text-amber-400 block">Oficina do Silva (Tenant 2)</span>
            </button>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 py-6 px-4 shadow-2xl border border-slate-800 sm:rounded-2xl sm:px-8 backdrop-blur-md">
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 flex items-start gap-2.5 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@oficina.com.br"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha
                </label>
                <span className="text-[11px] text-slate-500">Padrão demo: senha123456</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isPending}
                rightIcon={<UserCheck className="w-4 h-4" />}
              >
                Entrar no Sistema
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Quer cadastrar uma nova oficina?{" "}
              <Link
                href="/register"
                className="font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              >
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-500 text-xs">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Isolamento Multi-Tenant estrito • Criptografia de ponta a ponta</span>
        </div>
      </div>
    </div>
  );
}
