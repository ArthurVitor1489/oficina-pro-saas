"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { Wrench, Shield, Building2, User, Mail, Lock, Phone, AlertCircle, ArrowRight } from "lucide-react";
import { registerAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-950 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              Oficina<span className="text-sky-400">Pro</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              NOVO CADASTRO DE OFICINA
            </p>
          </div>
        </div>

        <h2 className="text-center text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
          Cadastre sua Oficina no SaaS
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-400">
          Crie seu ambiente exclusivo com isolamento de dados e segurança total.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-900/90 py-6 px-4 shadow-2xl border border-slate-800 sm:rounded-2xl sm:px-8 backdrop-blur-md">
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 flex items-start gap-2.5 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Seção Oficina */}
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Dados da Empresa
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Razão Social / Nome da Oficina *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    placeholder="Ex: Garagem Motors Auto Center Ltda"
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    name="tradeName"
                    placeholder="Ex: Garagem Motors"
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CNPJ ou CPF *
                  </label>
                  <input
                    type="text"
                    name="document"
                    required
                    placeholder="00.000.000/0001-00"
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone / WhatsApp Comercial
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="(11) 99999-9999"
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Seção Administrador */}
            <div className="pt-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Administrador / Proprietário (Owner)
              </span>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo do Responsável *
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    required
                    placeholder="Seu nome completo"
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail de Login *
                  </label>
                  <input
                    type="email"
                    name="ownerEmail"
                    required
                    placeholder="seuemail@oficina.com.br"
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Senha de Acesso * (mínimo 6 caracteres)
                  </label>
                  <input
                    type="password"
                    name="ownerPassword"
                    required
                    placeholder="••••••••"
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isPending}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Cadastrar Oficina & Acessar
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Já possui conta cadastrada?{" "}
              <Link
                href="/login"
                className="font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-500 text-xs">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ambiente isolado • Tenant seguro com Drizzle e Turso</span>
        </div>
      </div>
    </div>
  );
}
