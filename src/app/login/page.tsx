"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUserAction, getPublicTenantInfoAction } from "@/modules/auth/actions";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant");

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<{ id: string; name: string; slug: string } | null>(null);

  useEffect(() => {
    if (tenantSlug) {
      getPublicTenantInfoAction(tenantSlug)
        .then((info) => setTenantInfo(info))
        .catch(() => {});
    }
  }, [tenantSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginUserAction({
        email: formData.email,
        password: formData.password,
        tenantSlug: tenantSlug || undefined,
      });
      if (res.success) {
        router.push("/agenda");
      }
    } catch (err: any) {
      setErrorMessage(
        err.message?.replace("TenantMismatch: ", "") ||
          "Error al iniciar sesión. Verifique sus credenciales."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative z-10 border border-white/10">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <Link href="/" className="inline-flex items-center space-x-2.5 group mb-1">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 p-0.5 flex items-center justify-center shadow-2xl shadow-blue-500/25 group-hover:border-blue-400/50 transition overflow-hidden">
            <img src="/assets/vaIcon.svg" alt="VASaaS Logo" className="w-full h-full object-contain scale-140" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">
            VASaaS
          </span>
        </Link>

        {tenantSlug && tenantInfo ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-inner space-y-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Portal Empresa
            </span>
            <h1 className="text-lg font-black text-white tracking-tight">
              Ingresando a {tenantInfo.name}
            </h1>
            <p className="text-[11px] text-slate-400">
              Acceso restringido para personal registrado de esta empresa.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ingresá tus credenciales para acceder al panel de control de tu negocio.
            </p>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 text-xs text-rose-300 text-center font-medium leading-relaxed">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
          <input
            type="email"
            placeholder="nombre@minegocio.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-300">Contraseña</label>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Instrucciones de recuperación enviadas a su email"); }} className="text-xs text-blue-400 hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full glass-btn-primary font-bold text-sm py-3 rounded-xl shadow-xl text-white transition disabled:opacity-50"
        >
          {isLoading ? "Ingresando..." : "Ingresar a mi Cuenta"}
        </button>
      </form>

      <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400">
        ¿Aún no tenés tu negocio registrado?{" "}
        <Link href="/register" className="text-blue-400 font-bold hover:underline">
          Registrar mi Negocio Gratis
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      {/* Background ambient radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.18),rgba(255,255,255,0))] pointer-events-none" />

      <Suspense fallback={<div className="text-xs text-slate-400">Cargando portal...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
