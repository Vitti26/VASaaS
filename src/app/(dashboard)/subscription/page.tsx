"use client";

import React, { useState } from "react";

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState<"STARTER" | "PRO">("STARTER");
  const [trialDaysLeft] = useState(12);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedPlanForTransfer, setSelectedPlanForTransfer] = useState<"STARTER" | "PRO">("PRO");
  const [transferSuccess, setTransferSuccess] = useState(false);

  const handleSubscribeMercadoPago = async (plan: "STARTER" | "PRO") => {
    const price = plan === "PRO" ? "$100.000 ARS/mes" : "$50.000 ARS/mes";
    alert(`Redirigiendo a Mercado Pago para procesar la suscripción al Plan ${plan} (${price})...`);
    setCurrentPlan(plan);
  };

  const handleOpenTransfer = (plan: "STARTER" | "PRO") => {
    setSelectedPlanForTransfer(plan);
    setTransferSuccess(false);
    setShowTransferModal(true);
  };

  const handleNotifyTransfer = () => {
    setTransferSuccess(true);
    setTimeout(() => {
      setShowTransferModal(false);
      setTransferSuccess(false);
      alert("¡Gracias! Notificamos tu comprobante de Cuenta DNI/Transferencia. Tu plan se activará en breve.");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#111216] p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Mi Suscripción SaaS (VASaaS)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de tu suscripción con Mercado Pago o Transferencia / Cuenta DNI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSubscribeMercadoPago("PRO")}
            className="ventura-btn-primary text-xs shadow-lg text-[#0f172a] font-extrabold px-4 py-2.5 rounded-xl"
          >
            Pagar con Mercado Pago
          </button>
          <button
            onClick={() => handleOpenTransfer("PRO")}
            className="ventura-btn-dark text-xs border border-emerald-500/40 text-emerald-400 font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-500/10"
          >
            Pagar con Cuenta DNI
          </button>
        </div>
      </div>

      {/* Ventura Dark Trial Status Banner */}
      <div className="bg-[#111216] rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Período de Prueba Activo (Trial)
          </span>
          <h3 className="text-xl font-extrabold text-white mt-2">
            Te quedan {trialDaysLeft} días de prueba gratuita
          </h3>
          <p className="text-xs text-slate-400">
            Plan actual: <span className="font-bold text-[#c6f500]">{currentPlan}</span>. Podés cambiar de plan o suscribirte en cualquier momento.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSubscribeMercadoPago("PRO")}
            className="ventura-btn-primary px-4 py-2.5 rounded-xl font-bold text-xs text-[#0f172a]"
          >
            Suscribirme ($100.000/mes)
          </button>
          <button
            onClick={() => handleOpenTransfer("PRO")}
            className="ventura-btn-dark px-4 py-2.5 rounded-xl font-bold text-xs border border-slate-700 text-slate-200"
          >
            Cuenta DNI
          </button>
        </div>
      </div>

      {/* Plan Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Starter Plan */}
        <div
          className={`bg-[#111216] p-8 rounded-3xl border flex flex-col justify-between space-y-6 transition shadow-xl ${
            currentPlan === "STARTER"
              ? "border-blue-500/50 ring-1 ring-blue-500/30"
              : "border-slate-800"
          }`}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-white">Plan STARTER</h3>
              {currentPlan === "STARTER" && (
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Plan Activo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Ideal para negocios monosucursal que están empezando.</p>
            <div className="text-4xl font-black text-white tracking-tight">
              $50.000 <span className="text-xs font-normal text-slate-400">ARS / mes</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-3 border-t border-slate-800 pt-5 font-medium">
              <li className="flex items-center gap-2">✓ 1 Sucursal incluida</li>
              <li className="flex items-center gap-2">✓ Hasta 3 Usuarios Staff</li>
              <li className="flex items-center gap-2">✓ Agenda de turnos interna + Booking Público</li>
              <li className="flex items-center gap-2">✓ Control de stock por sucursal</li>
              <li className="flex items-center gap-2 text-slate-500">✕ Sin Facturación Electrónica ARCA</li>
              <li className="flex items-center gap-2 text-slate-500 font-semibold line-through">
                ✕ Soporte Prioritario
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleSubscribeMercadoPago("STARTER")}
              className="ventura-btn-dark w-full py-3 rounded-xl font-bold text-xs border border-slate-700 text-slate-200 hover:border-white"
            >
              Pagar $50.000/mes con Mercado Pago
            </button>
            <button
              onClick={() => handleOpenTransfer("STARTER")}
              className="w-full py-2.5 rounded-xl font-bold text-xs border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              Pagar $50.000/mes con Cuenta DNI
            </button>
          </div>
        </div>

        {/* Pro Plan */}
        <div
          className={`bg-[#111216] p-8 rounded-3xl border flex flex-col justify-between space-y-6 transition shadow-2xl ${
            currentPlan === "PRO"
              ? "border-[#c6f500] ring-1 ring-[#c6f500]/50"
              : "border-[#c6f500]/40"
          }`}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-white">Plan PRO</h3>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#c6f500] text-[#0f172a]">
                Recomendado
              </span>
            </div>
            <p className="text-xs text-slate-400">Para negocios en expansión multi-sucursal y emisión fiscal ARCA.</p>
            <div className="text-4xl font-black text-white tracking-tight">
              $100.000 <span className="text-xs font-normal text-slate-400">ARS / mes</span>
            </div>
            <ul className="text-xs text-slate-200 space-y-3 border-t border-slate-800 pt-5 font-semibold">
              <li className="flex items-center gap-2 text-[#c6f500]">✓ Multi-sucursal Ilimitada</li>
              <li className="flex items-center gap-2 text-[#c6f500]">✓ Usuarios e integrantes Ilimitados</li>
              <li className="flex items-center gap-2">✓ Agenda de turnos e insumos de servicio</li>
              <li className="flex items-center gap-2 font-bold text-emerald-400">
                ✓ Facturador Electrónico ARCA/AFIP Habilitado (WSFEv1/WSAA)
              </li>
              <li className="flex items-center gap-2 font-extrabold text-emerald-400">
                ✓ Soporte Prioritario 24/7 (WhatsApp & Mail)
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleSubscribeMercadoPago("PRO")}
              className="ventura-btn-primary w-full py-3.5 rounded-xl font-extrabold text-xs shadow-lg text-[#0f172a]"
            >
              Suscribirme a Plan PRO ($100.000/mes) con Mercado Pago
            </button>
            <button
              onClick={() => handleOpenTransfer("PRO")}
              className="w-full py-2.5 rounded-xl font-bold text-xs border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            >
              Pagar $100.000/mes con Cuenta DNI / Transferencia
            </button>
          </div>
        </div>
      </div>

      {/* Cuenta DNI / Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111216] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white">Pago con Cuenta DNI / CBU</h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-[#181920] p-4 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400">
                Transferí el monto de <strong className="text-white">{selectedPlanForTransfer === "PRO" ? "$100.000 ARS" : "$50.000 ARS"}</strong> a la siguiente cuenta oficial:
              </p>
              <div className="space-y-2 pt-1 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">Alias Cuenta DNI / CVU:</span>
                  <code className="text-emerald-400 font-bold text-sm bg-black/40 px-2 py-1 rounded">barberia.saas.mp</code>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">CBU Banco Provincia:</span>
                  <code className="text-slate-200 font-mono text-xs bg-black/40 px-2 py-1 rounded">0000003100012345678901</code>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Titular de la cuenta:</span>
                  <span className="text-white font-semibold">VASaaS Barberías S.A.</span>
                </div>
              </div>
            </div>

            {transferSuccess ? (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-center text-xs font-bold">
                ¡Comprobante enviado con éxito! Verificaremos tu pago en instantes.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleNotifyTransfer}
                  className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg hover:bg-emerald-400"
                >
                  Notificar Pago Realizado
                </button>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="w-full py-2.5 rounded-xl border border-slate-800 text-slate-400 font-bold text-xs hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
