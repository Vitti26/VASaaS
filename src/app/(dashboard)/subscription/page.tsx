"use client";

import React, { useState } from "react";

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState<"STARTER" | "PRO">("STARTER");
  const [trialDaysLeft] = useState(12);

  const handleSubscribe = (plan: "STARTER" | "PRO") => {
    const price = plan === "PRO" ? "$25.000 ARS/mes" : "$12.000 ARS/mes";
    if (confirm(`Redirigiendo a Mercado Pago para suscribirse al Plan ${plan} (${price})...`)) {
      setCurrentPlan(plan);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Mi Suscripción SaaS (VASaaS)</h1>
        <p className="text-sm text-slate-400 mt-1">
          Gestión de plan y cobro recurrente mediante Mercado Pago Subscriptions API.
        </p>
      </div>

      {/* Glassmorphic Trial Status Banner */}
      <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-blue-500/30">
        <div>
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md">
            ⏳ Período de Prueba Activo (Trial)
          </span>
          <h3 className="text-xl font-bold text-white mt-2">
            Te quedan {trialDaysLeft} días de prueba gratuita
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Plan actual: <span className="font-bold text-white">{currentPlan}</span>. Podés cambiar de plan o suscribirte en cualquier momento.
          </p>
        </div>
        <button
          onClick={() => handleSubscribe("PRO")}
          className="glass-btn-primary px-5 py-3 rounded-xl font-bold text-xs text-white shadow-xl whitespace-nowrap"
        >
          💳 Suscribirme con Mercado Pago
        </button>
      </div>

      {/* Plan Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Starter Plan */}
        <div className={`glass-card rounded-2xl p-7 flex flex-col justify-between space-y-6 ${currentPlan === "STARTER" ? "ring-2 ring-blue-500 border-blue-500/50" : ""}`}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">Plan Starter</h3>
              {currentPlan === "STARTER" && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Plan Activo
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">Ideal para negocios monosucursal que están empezando.</p>
            <div className="text-4xl font-black text-white tracking-tight">
              $12.000 <span className="text-sm font-normal text-slate-400">ARS / mes</span>
            </div>
            <ul className="text-sm text-slate-300 space-y-3 border-t border-white/10 pt-5">
              <li className="flex items-center gap-2">✓ 1 Sucursal incluida</li>
              <li className="flex items-center gap-2">✓ Hasta 3 Usuarios Staff</li>
              <li className="flex items-center gap-2">✓ Agenda de turnos interna + Booking Público</li>
              <li className="flex items-center gap-2">✓ Control de stock por sucursal</li>
              <li className="flex items-center gap-2 text-slate-500">✕ Sin Facturación Electrónica AFIP</li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe("STARTER")}
            className="glass-btn-secondary w-full py-3 rounded-xl font-semibold text-sm text-white"
          >
            {currentPlan === "STARTER" ? "Mantener Plan Starter" : "Cambiar a Starter"}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`glass-card rounded-2xl p-7 flex flex-col justify-between space-y-6 ${currentPlan === "PRO" ? "ring-2 ring-emerald-500 border-emerald-500/50" : ""}`}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">Plan PRO</h3>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ⭐ Recomendado
              </span>
            </div>
            <p className="text-sm text-slate-400">Para negocios en expansión multi-sucursal y emisión fiscal AFIP.</p>
            <div className="text-4xl font-black text-emerald-400 tracking-tight">
              $25.000 <span className="text-sm font-normal text-slate-400">ARS / mes</span>
            </div>
            <ul className="text-sm text-slate-300 space-y-3 border-t border-white/10 pt-5">
              <li className="flex items-center gap-2">✓ Multi-sucursal Ilimitada</li>
              <li className="flex items-center gap-2">✓ Usuarios e integrantes Ilimitados</li>
              <li className="flex items-center gap-2">✓ Agenda de turnos e insumos de servicio</li>
              <li className="flex items-center gap-2 font-bold text-emerald-400">
                ⚡ Facturador Electrónico AFIP Habilitado (WSFEv1/WSAA)
              </li>
              <li className="flex items-center gap-2">✓ Soporte prioritario</li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe("PRO")}
            className="glass-btn-primary w-full py-3 rounded-xl font-bold text-sm text-white shadow-xl"
          >
            {currentPlan === "PRO" ? "Plan Activo (Suscrito)" : "Suscribirme a Plan PRO"}
          </button>
        </div>
      </div>
    </div>
  );
}
