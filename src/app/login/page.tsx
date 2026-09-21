"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUserAction } from "@/modules/auth/actions";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginUserAction(formData);
      if (res.success) {
        router.push("/agenda");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al iniciar sesión. Verifique sus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      {/* Background ambient radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.18),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center space-x-2.5 group mb-1">
            <span className="bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 text-white p-2.5 rounded-xl font-black text-sm tracking-wider shadow-lg shadow-blue-500/25">
              VA
            </span>
            <span className="font-extrabold text-xl text-white tracking-tight">
              VASaaS
            </span>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ingresá tus credenciales para acceder al panel de control de tu negocio.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 text-xs text-rose-300 text-center font-medium">
            ⚠️ {errorMessage}
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
    </div>
  );
}
