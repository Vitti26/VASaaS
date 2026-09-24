"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createPublicBookingAction, getPublicBranchDataAction } from "@/modules/agenda/actions";

export default function PublicBookingPage({
  params,
}: {
  params: { tenantSlug: string; branchSlug: string };
}) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"MP" | "CUENTA_DNI" | null>(null);
  const [depositNotified, setDepositNotified] = useState(false);

  const [branchData, setBranchData] = useState<{
    tenant: {
      id: string;
      name: string;
      slug: string;
      requireDeposit?: boolean;
      depositAmount?: number;
      cuentaDniAlias?: string | null;
      cuentaDniCbu?: string | null;
      cuentaDniTitular?: string | null;
      mpPublicKey?: string | null;
    };
    branch: { id: string; name: string };
    services: Array<{ id: string; name: string; price: number; durationMinutes: number }>;
    staff: Array<{ id: string; name: string }>;
  } | null>(null);

  const [bookingResult, setBookingResult] = useState<{
    id: string;
    customerName: string;
    serviceName: string;
    startAt: string;
    date: string;
  } | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const [formLoadedAt, setFormLoadedAt] = useState<number>(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    serviceId: "",
    staffId: "",
    date: todayStr,
    time: "14:00",
    notes: "",
    website: "", // Honeypot field for anti-bot protection
  });

  useEffect(() => {
    setFormLoadedAt(Date.now());
    async function loadData() {
      try {
        const data = await getPublicBranchDataAction(params.tenantSlug, params.branchSlug);
        if (data) {
          setBranchData(data);
          if (data.services.length > 0 && data.staff.length > 0) {
            setFormData((prev) => ({
              ...prev,
              serviceId: data.services[0].id,
              staffId: data.staff[0].id,
            }));
          }
        }
      } catch (err: any) {
        console.error("Error al cargar sucursal:", err);
      }
    }
    loadData();
  }, [params.tenantSlug, params.branchSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.serviceId || !formData.staffId) {
      setErrorMessage("Por favor seleccione un servicio y un profesional.");
      return;
    }

    if (!formData.name || !formData.phone) {
      setErrorMessage("Por favor ingrese su nombre y teléfono.");
      return;
    }

    // Check if deposit is required
    if (branchData?.tenant?.requireDeposit && !selectedPaymentMethod) {
      setShowDepositModal(true);
      return;
    }

    await processBooking();
  };

  const processBooking = async () => {
    setIsSubmitting(true);
    try {
      const startAtDate = new Date(`${formData.date}T${formData.time}:00`);

      const res = await createPublicBookingAction({
        tenantSlug: params.tenantSlug,
        branchSlug: params.branchSlug,
        serviceId: formData.serviceId,
        staffId: formData.staffId,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email || undefined,
        startAt: startAtDate,
        notes: formData.notes,
        website: formData.website,
        formLoadedAt,
      });

      if (res.success && res.appointment) {
        const selectedService = branchData?.services.find((s) => s.id === formData.serviceId);
        setBookingResult({
          id: res.appointment.id.slice(-6).toUpperCase(),
          customerName: formData.name,
          serviceName: selectedService?.name || "Servicio Seleccionado",
          startAt: formData.time + " hs",
          date: formData.date,
        });
        setSubmitted(true);
        setShowDepositModal(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al procesar la reserva. Intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      {/* Background radial ambient glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative z-10">
        {/* Top Header Bar with Staff Access Link */}
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 p-0.5 flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/assets/vaIcon.svg" alt="VASaaS Logo" className="w-full h-full object-contain scale-130" />
            </div>
            <span className="font-extrabold text-sm text-white tracking-tight">
              VASaaS
            </span>
          </Link>

          <Link
            href={`/b/${params.tenantSlug}/login`}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-[11px] font-semibold transition"
          >
            <span>Acceso Staff</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div>
            <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20 backdrop-blur-md">
              Reserva de Turnos Online
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {branchData?.tenant.name || "Barbería & Estética"}
          </h1>
          <p className="text-xs text-slate-400">
            Sucursal: <span className="text-slate-200 font-semibold">{branchData?.branch.name || "Principal"}</span>
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-2xl text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {submitted && bookingResult ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-black">
              ✓
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">¡Reserva Confirmada!</h2>
              <p className="text-xs text-slate-400">
                Tu turno fue registrado exitosamente en el sistema de la barbería.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400 font-medium">Código de Reserva:</span>
                <span className="font-mono font-bold text-blue-400">#{bookingResult.id}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400 font-medium">Cliente:</span>
                <span className="font-bold text-white">{bookingResult.customerName}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400 font-medium">Servicio:</span>
                <span className="font-bold text-white">{bookingResult.serviceName}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400 font-medium">Fecha:</span>
                <span className="font-bold text-white">{bookingResult.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Horario:</span>
                <span className="font-bold text-emerald-400">{bookingResult.startAt}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSubmitted(false);
                setSelectedPaymentMethod(null);
              }}
              className="w-full glass-btn-primary font-bold text-xs py-3 rounded-xl text-white"
            >
              Agendar Otro Turno
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot field for anti-bot protection */}
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Servicio Deseado
              </label>
              <select
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              >
                {branchData?.services && branchData.services.length > 0 ? (
                  branchData.services.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} (${srv.price.toLocaleString("es-AR")} - {srv.durationMinutes} min)
                    </option>
                  ))
                ) : (
                  <option value="">Cargando servicios disponibles...</option>
                )}
              </select>
            </div>

            {branchData?.staff && branchData.staff.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Profesional / Atendido por
                </label>
                <select
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                >
                  {branchData.staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fecha</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Horario</label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="10:00">10:00 hs</option>
                  <option value="11:30">11:30 hs</option>
                  <option value="14:00">14:00 hs</option>
                  <option value="16:30">16:30 hs</option>
                  <option value="18:00">18:00 hs</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono Móvil</label>
                <input
                  type="tel"
                  placeholder="+54 11 ..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  placeholder="juan@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Notas u Observaciones (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Prefiero atención puntual..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full glass-btn-primary font-bold text-sm py-3.5 rounded-xl shadow-xl text-white transition disabled:opacity-50"
            >
              {isSubmitting
                ? "Guardando Reserva..."
                : branchData?.tenant?.requireDeposit
                ? `Continuar a Pago de Seña ($${(branchData.tenant.depositAmount || 2000).toLocaleString("es-AR")})`
                : "Confirmar Solicitud de Turno"}
            </button>
          </form>
        )}
      </div>

      {/* Deposit Payment Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111216] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">Pago de Seña de Turno</h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Para confirmar tu turno en <strong className="text-white">{branchData?.tenant?.name}</strong> se requiere abonar una seña de <strong className="text-emerald-400 font-bold">${(branchData?.tenant?.depositAmount || 2000).toLocaleString("es-AR")} ARS</strong>.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-400">Seleccioná tu método de pago:</label>

              {/* Mercado Pago Option */}
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod("MP")}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition ${
                  selectedPaymentMethod === "MP"
                    ? "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500"
                    : "border-slate-800 bg-[#181920] text-slate-300 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-white">Mercado Pago</div>
                  <div className="text-[11px] text-slate-400">Tarjetas de crédito, débito o dinero en cuenta</div>
                </div>
                <span className="text-xs font-extrabold text-blue-400">MP</span>
              </button>

              {/* Cuenta DNI Option */}
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod("CUENTA_DNI")}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition ${
                  selectedPaymentMethod === "CUENTA_DNI"
                    ? "border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500"
                    : "border-slate-800 bg-[#181920] text-slate-300 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-white">Cuenta DNI / Banco Provincia / CBU</div>
                  <div className="text-[11px] text-slate-400">Transferencia bancaria sin comisión</div>
                </div>
                <span className="text-xs font-extrabold text-emerald-400">DNI</span>
              </button>
            </div>

            {/* If Cuenta DNI is selected, show bank account details */}
            {selectedPaymentMethod === "CUENTA_DNI" && (
              <div className="bg-[#181920] border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
                <span className="text-slate-400 font-bold block">Datos de transferencia:</span>
                <div>
                  <span className="text-slate-400 block">Alias Cuenta DNI:</span>
                  <code className="text-emerald-400 font-bold bg-black/40 px-2 py-0.5 rounded">
                    {branchData?.tenant?.cuentaDniAlias || "barberia.central.mp"}
                  </code>
                </div>
                <div>
                  <span className="text-slate-400 block">CBU / CVU:</span>
                  <code className="text-slate-200 font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded">
                    {branchData?.tenant?.cuentaDniCbu || "0000003100098765432100"}
                  </code>
                </div>
                <div>
                  <span className="text-slate-400 block">Titular:</span>
                  <span className="text-white font-semibold">
                    {branchData?.tenant?.cuentaDniTitular || "Barbería Central SRL"}
                  </span>
                </div>
              </div>
            )}

            {selectedPaymentMethod && (
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setDepositNotified(true);
                    await processBooking();
                  }}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Confirmando..."
                    : selectedPaymentMethod === "MP"
                    ? "Pagar Seña con Mercado Pago"
                    : "Notificar Transferencia y Confirmar Turno"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
