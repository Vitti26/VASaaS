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
  
  const [branchData, setBranchData] = useState<{
    tenant: { id: string; name: string; slug: string };
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
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (!formData.serviceId || !formData.staffId) {
        throw new Error("Por favor seleccione un servicio y un profesional.");
      }

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
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center space-x-2.5 group mb-1">
            <span className="bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 text-white p-2 rounded-xl font-black text-xs tracking-wider shadow-lg shadow-blue-500/25">
              VA
            </span>
            <span className="font-extrabold text-lg text-white tracking-tight">
              VASaaS
            </span>
          </Link>
          <div>
            <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20 backdrop-blur-md">
              Reserva de Turnos Online
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight capitalize">
            {branchData?.tenant.name || params.tenantSlug.replace("-", " ")} - {branchData?.branch.name || params.branchSlug.replace("-", " ")}
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Completá tus datos para agendar tu turno al instante sin necesidad de crear usuario.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 text-xs text-rose-300 text-center font-medium">
            ⚠️ {errorMessage}
          </div>
        )}

        {submitted && bookingResult ? (
          <div className="glass-card rounded-2xl p-6 text-center space-y-4 border-emerald-500/30">
            <div className="text-4xl">🎉</div>
            <h3 className="text-xl font-bold text-emerald-400">
              ¡Turno Confirmado y Guardado!
            </h3>
            <p className="text-xs text-slate-300">
              Tu reserva fue registrada en el sistema de la sucursal.
            </p>

            <div className="text-xs text-slate-300 space-y-2 font-mono bg-slate-950/80 p-4 rounded-xl text-left border border-white/10">
              <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider mb-2">Comprobante de Reserva:</p>
              <p><strong className="text-white">Código:</strong> #{bookingResult.id}</p>
              <p><strong className="text-white">Cliente:</strong> {bookingResult.customerName}</p>
              <p><strong className="text-white">Servicio:</strong> {bookingResult.serviceName}</p>
              <p><strong className="text-white">Fecha:</strong> {bookingResult.date}</p>
              <p><strong className="text-white">Horario:</strong> {bookingResult.startAt}</p>
            </div>

            <button
              onClick={() => {
                setSubmitted(false);
                setFormData((prev) => ({ ...prev, name: "", phone: "", email: "", notes: "" }));
              }}
              className="w-full glass-btn-secondary py-2.5 rounded-xl font-semibold text-xs text-white"
            >
              Solicitar Otro Turno
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* Anti-bot honeypot input (hidden from real users, filled by automated spambots) */}
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
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
                  <>
                    <option value="">Cargando servicios disponibles...</option>
                  </>
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
              className="w-full glass-btn-primary font-bold text-sm py-3 rounded-xl shadow-xl text-white transition disabled:opacity-50"
            >
              {isSubmitting ? "Guardando Reserva..." : "⚡ Confirmar Solicitud de Turno"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
