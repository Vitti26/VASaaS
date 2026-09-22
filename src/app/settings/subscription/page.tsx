"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PLAN_LIMITS_MAP, SubscriptionPlanType, SubscriptionStatusType } from "@/modules/subscriptions/domain/subscription-policy";

export default function SubscriptionSettingsPage() {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlanType>("STARTER");
  const [status, setStatus] = useState<SubscriptionStatusType>("ACTIVE");
  const [mpConnected, setMpConnected] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const planInfo = PLAN_LIMITS_MAP[currentPlan];

  const handleUpgrade = (targetPlan: SubscriptionPlanType) => {
    setIsProcessing(true);
    setTimeout(() => {
      setCurrentPlan(targetPlan);
      setStatus("ACTIVE");
      setIsProcessing(false);
      alert(`¡Plan actualizado con éxito a ${PLAN_LIMITS_MAP[targetPlan].name}!`);
    }, 800);
  };

  const handleConnectMp = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setMpConnected(true);
      setIsProcessing(false);
      alert("¡Cuenta de Mercado Pago vinculada exitosamente! Ahora podés cobrar señas en tus reservas online.");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col p-4 sm:p-8 selection:bg-blue-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.12),rgba(255,255,255,0))] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full space-y-8 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Link href="/agenda" className="hover:text-white transition">Agenda</Link>
          <span>/</span>
          <span className="text-white font-medium">Suscripción y Pagos</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Mi Suscripción & Mercado Pago</h1>
            <p className="text-xs text-slate-400 mt-1">
              Gestioná tu plan de VASaaS, facturación recurrente y vinculación de Mercado Pago para cobro de señas.
            </p>
          </div>
          <div>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                status === "ACTIVE"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : status === "TRIALING"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
              }`}
            >
              • {status === "ACTIVE" ? "Suscripción Activa" : status === "TRIALING" ? "Período de Prueba" : "Pausada por Impago"}
            </span>
          </div>
        </div>

        {/* Soft-lock Protection Notice */}
        <div className="glass-card rounded-2xl p-4 border-blue-500/30 bg-blue-950/20 text-xs text-slate-300 flex items-start space-x-3">
          <span className="text-xl">🛡️</span>
          <div>
            <strong className="text-white font-semibold block mb-0.5">Garantía de Resguardo de Datos (Bloqueo Suave):</strong>
            Si tu suscripción entra en estado moroso o pausado, tu información **NUNCA** se elimina. Podrás seguir ingresando, consultando historial y exportando datos en modo solo lectura.
          </div>
        </div>

        {/* Current Plan Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel rounded-3xl p-6 space-y-4 border-white/10">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Plan Actual</span>
                <h3 className="text-xl font-bold text-white mt-1">{planInfo.name}</h3>
              </div>
              <span className="text-2xl font-extrabold text-white">${planInfo.priceMonthlyARS.toLocaleString("es-AR")}<span className="text-xs text-slate-400 font-normal">/mes</span></span>
            </div>

            <ul className="text-xs text-slate-300 space-y-2 border-t border-white/10 pt-4">
              <li className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Hasta <strong>{planInfo.maxBranches}</strong> {planInfo.maxBranches === 1 ? "sucursal" : "sucursales"}</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Hasta <strong>{planInfo.maxStaff}</strong> profesionales / colaboradores</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Facturación ARCA: <strong>{planInfo.arcaFiscalEnabled ? "Incluida (Factura A, B, C)" : "Disponible en Plan Pro"}</strong></span>
              </li>
            </ul>

            <div className="pt-2">
              {currentPlan === "STARTER" ? (
                <button
                  onClick={() => handleUpgrade("PRO")}
                  disabled={isProcessing}
                  className="w-full glass-btn-primary font-bold text-xs py-3 rounded-xl text-white shadow-lg transition"
                >
                  ⚡ Cambiar a Plan Pro ($35.000 / mes)
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade("STARTER")}
                  disabled={isProcessing}
                  className="w-full glass-btn-secondary font-semibold text-xs py-2.5 rounded-xl text-slate-300 transition"
                >
                  Cambiar a Plan Starter ($15.000 / mes)
                </button>
              )}
            </div>
          </div>

          {/* Mercado Pago Account Connect Box */}
          <div className="glass-panel rounded-3xl p-6 space-y-4 border-emerald-500/20">
            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Cobro de Señas en Reservas</span>
              <h3 className="text-xl font-bold text-white mt-1">Mercado Pago del Negocio</h3>
            </div>

            <p className="text-xs text-slate-300">
              Vinculá tu propia cuenta de Mercado Pago para requerir seña a tus clientes al reservar turnos desde tu portal web. El dinero ingresa directo a tu cuenta de Mercado Pago.
            </p>

            <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/10 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Estado de Vinculación:</span>
                <span className={`font-semibold ${mpConnected ? "text-emerald-400" : "text-amber-400"}`}>
                  {mpConnected ? "● Cuenta Conectada" : "○ No Conectada"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tiempo de vencimiento de seña:</span>
                <span className="text-white font-mono">15 minutos</span>
              </div>
            </div>

            <button
              onClick={handleConnectMp}
              disabled={isProcessing}
              className={`w-full font-bold text-xs py-3 rounded-xl shadow-lg transition ${
                mpConnected
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90"
              }`}
            >
              {mpConnected ? "✓ Mercado Pago Vinculado" : "🔗 Conectar Cuenta Mercado Pago"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
