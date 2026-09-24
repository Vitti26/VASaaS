"use client";

import React, { useState, useEffect } from "react";

export default function PaymentGatewaysPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpPublicKey, setMpPublicKey] = useState("");

  const [cuentaDniAlias, setCuentaDniAlias] = useState("");
  const [cuentaDniCbu, setCuentaDniCbu] = useState("");
  const [cuentaDniTitular, setCuentaDniTitular] = useState("");

  const [requireDeposit, setRequireDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(2000);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings/payment-gateways?slug=barberia-demo");
        if (res.ok) {
          const data = await res.json();
          if (data.paymentGateways) {
            setMpAccessToken(data.paymentGateways.mpAccessToken || "");
            setMpPublicKey(data.paymentGateways.mpPublicKey || "");
            setCuentaDniAlias(data.paymentGateways.cuentaDniAlias || "");
            setCuentaDniCbu(data.paymentGateways.cuentaDniCbu || "");
            setCuentaDniTitular(data.paymentGateways.cuentaDniTitular || "");
            setRequireDeposit(data.paymentGateways.requireDeposit || false);
            setDepositAmount(data.paymentGateways.depositAmount || 2000);
          }
        }
      } catch (err) {
        console.error("Error cargando pasarelas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/settings/payment-gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: "barberia-demo",
          mpAccessToken,
          mpPublicKey,
          cuentaDniAlias,
          cuentaDniCbu,
          cuentaDniTitular,
          requireDeposit,
          depositAmount: Number(depositAmount),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("¡Configuración de pagos guardada correctamente!");
      } else {
        setErrorMsg(data.error || "Error al guardar la configuración.");
      }
    } catch (err: any) {
      setErrorMsg("Error de conexión al guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
        <p className="text-xs font-semibold">Cargando métodos de cobro...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-[#111216] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Métodos de Cobro & Pasarelas</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configurá Mercado Pago y Cuenta DNI / Banco Provincia para recibir pagos de turnos y señas directamente en tu cuenta.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl text-xs font-bold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Mercado Pago Credentials */}
        <div className="bg-[#111216] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm">
              MP
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Mercado Pago (Cobros Directos)</h2>
              <p className="text-xs text-slate-400">Ingresá tus credenciales de Mercado Pago Developers para recibir señas automáticamente.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Access Token de Producción (`APP_USR-...`)
              </label>
              <input
                type="password"
                value={mpAccessToken}
                onChange={(e) => setMpAccessToken(e.target.value)}
                placeholder="APP_USR-xxxxxx-xxxxxx-xxxxxx"
                className="w-full bg-[#181920] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Public Key de Producción (`APP_USR-...`)
              </label>
              <input
                type="text"
                value={mpPublicKey}
                onChange={(e) => setMpPublicKey(e.target.value)}
                placeholder="APP_USR-xxxxxx-xxxxxx-xxxxxx"
                className="w-full bg-[#181920] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Cuenta DNI / Transferencia Bancaria */}
        <div className="bg-[#111216] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm">
              DNI
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Cuenta DNI / Banco Provincia / CBU</h2>
              <p className="text-xs text-slate-400">Tus clientes podrán enviarte transferencias directas sin comisión desde Cuenta DNI o cualquier banco.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Alias de Cuenta DNI / CVU
              </label>
              <input
                type="text"
                value={cuentaDniAlias}
                onChange={(e) => setCuentaDniAlias(e.target.value)}
                placeholder="mi.barberia.mp"
                className="w-full bg-[#181920] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                CBU / CVU (22 dígitos)
              </label>
              <input
                type="text"
                value={cuentaDniCbu}
                onChange={(e) => setCuentaDniCbu(e.target.value)}
                placeholder="0000003100012345678901"
                className="w-full bg-[#181920] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nombre del Titular / Banco
              </label>
              <input
                type="text"
                value={cuentaDniTitular}
                onChange={(e) => setCuentaDniTitular(e.target.value)}
                placeholder="Juan Pérez - Banco Provincia"
                className="w-full bg-[#181920] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Deposit / Señas Policy */}
        <div className="bg-[#111216] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Política de Seña para Reservas Online</h2>
              <p className="text-xs text-slate-400">Exigir un pago previo o seña para confirmar los turnos desde la página web pública.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requireDeposit}
                onChange={(e) => setRequireDeposit(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {requireDeposit && (
            <div className="pt-2 max-w-xs">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Monto Fijo de Seña ($ ARS)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  placeholder="2000"
                  className="w-full bg-[#181920] border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="ventura-btn-primary px-8 py-3 rounded-xl font-extrabold text-xs text-[#0f172a] shadow-lg disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Cambios de Pasarela"}
          </button>
        </div>
      </form>
    </div>
  );
}
