"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerTenantAction } from "@/modules/auth/actions";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    ownerName: "",
    email: "",
    password: "",
    tenantName: "",
    tenantSlug: "",
    branchName: "Sucursal Central / Taller",
    branchAddress: "",
    serviceName: "Impresión / Servicio Principal",
    servicePrice: 15000,
  });

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.ownerName || !formData.email || !formData.password) {
        setErrorMessage("Por favor complete todos los datos del propietario.");
        return;
      }
      setErrorMessage(null);
      setStep(2);
    } else if (step === 2) {
      if (!formData.tenantName || !formData.tenantSlug) {
        setErrorMessage("Por favor ingrese el nombre y la dirección URL del negocio.");
        return;
      }
      setErrorMessage(null);
      setStep(3);
    }
  };

  const handleTenantNameChange = (name: string) => {
    const autoSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      tenantName: name,
      tenantSlug: autoSlug,
    }));
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await registerTenantAction(formData);
      if (res.success) {
        router.push("/agenda");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al completar el registro. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      {/* Background ambient radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.18),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
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
              Registro & Onboarding de Negocio
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Paso {step} de 3: {step === 1 ? "Datos del Propietario" : step === 2 ? "Nombre del Negocio" : "Sucursal & Servicio Inicial"}
            </p>
          </div>

          {/* Step Indicator Bar */}
          <div className="flex gap-2 pt-2">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-blue-500" : "bg-slate-800"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-blue-500" : "bg-slate-800"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? "bg-blue-500" : "bg-slate-800"}`} />
          </div>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 text-xs text-rose-300 text-center font-medium">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Step 1: Owner Info */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo del Dueño / Administrador</label>
              <input
                type="text"
                placeholder="Ej: Carlos Gómez"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico de Acceso</label>
              <input
                type="email"
                placeholder="contacto@miempresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contraseña de Seguridad</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full glass-btn-primary font-bold text-sm py-3 rounded-xl shadow-xl text-white transition"
            >
              Siguiente: Datos del Negocio ➔
            </button>
          </form>
        )}

        {/* Step 2: Tenant & Slug */}
        {step === 2 && (
          <form onSubmit={handleNextStep} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Comercial del Negocio / Empresa</label>
              <input
                type="text"
                placeholder="Ej: Gráfica & Imprenta PubliDesign"
                value={formData.tenantName}
                onChange={(e) => handleTenantNameChange(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">URL Pública Personalizada (Slug)</label>
              <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm">
                <span className="text-slate-500 font-mono text-xs select-none">vasaas.com/b/</span>
                <input
                  type="text"
                  placeholder="grafica-publidesign"
                  value={formData.tenantSlug}
                  onChange={(e) => setFormData({ ...formData, tenantSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  className="w-full bg-transparent text-white font-mono text-xs focus:outline-none ml-1"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Este será el link con el que tus clientes reservarán sus turnos online.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 glass-btn-secondary font-semibold text-xs py-3 rounded-xl text-slate-300"
              >
                ← Volver
              </button>
              <button
                type="submit"
                className="w-2/3 glass-btn-primary font-bold text-sm py-3 rounded-xl shadow-xl text-white transition"
              >
                Siguiente: Configuración Inicial ➔
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Initial Branch & Service */}
        {step === 3 && (
          <form onSubmit={handleSubmitFinal} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre de tu Primera Sucursal / Sede</label>
              <input
                type="text"
                placeholder="Ej: Sucursal Palermo"
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Dirección de la Sucursal (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Av. Santa Fe 3200"
                value={formData.branchAddress}
                onChange={(e) => setFormData({ ...formData, branchAddress: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Servicio Principal</label>
                <input
                  type="text"
                  placeholder="Ej: Corte + Peinado"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Precio ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.servicePrice}
                  onChange={(e) => setFormData({ ...formData, servicePrice: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 glass-btn-secondary font-semibold text-xs py-3 rounded-xl text-slate-300"
              >
                ← Volver
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 glass-btn-primary font-bold text-sm py-3 rounded-xl shadow-xl text-white transition disabled:opacity-50"
              >
                {isLoading ? "Creando tu Negocio..." : "⚡ Finalizar & Abrir Dashboard"}
              </button>
            </div>
          </form>
        )}

        <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400">
          ¿Ya tenés un negocio en VASaaS?{" "}
          <Link href="/login" className="text-blue-400 font-bold hover:underline">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
