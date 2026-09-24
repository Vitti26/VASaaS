"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "APPOINTMENT" | "STOCK" | "BILLING" | "SUBSCRIPTION";
  read: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fading Viewport Trial Policy State (30 Days + 7 Extra Fading Days = 37 Days Max)
  const [simulatedTrialDay, setSimulatedTrialDay] = useState<number>(33); // Default Day 33 to demonstrate fading

  const isGracePeriod = simulatedTrialDay > 30;
  const isBlackout = simulatedTrialDay >= 37;
  const extraDays = Math.min(7, Math.max(0, simulatedTrialDay - 30));
  const fadingOpacity = simulatedTrialDay <= 30 ? 0 : isBlackout ? 1.0 : extraDays / 7;

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "n1",
      title: "Nuevo turno agendado",
      message: "Marcelo Fernández reservó Corte + Peinado para hoy 14:00 hs.",
      time: "Hace 5 min",
      type: "APPOINTMENT",
      read: false,
    },
    {
      id: "n2",
      title: "Alerta de Reposición de Stock",
      message: "Tintura Rubio Claro alcanzó el nivel mínimo (3 unidades).",
      time: "Hace 20 min",
      type: "STOCK",
      read: false,
    },
    {
      id: "n3",
      title: "Factura ARCA Emitida",
      message: "Comprobante Factura B #0001-00000101 autorizado con CAE.",
      time: "Hace 1 hora",
      type: "BILLING",
      read: false,
    },
    {
      id: "n4",
      title: "Estado de Suscripción",
      message: "Te quedan 12 días de prueba gratuita en tu Plan STARTER.",
      time: "Hace 3 horas",
      type: "SUBSCRIPTION",
      read: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleQuickSubscribe = (plan: "STARTER" | "PRO") => {
    const price = plan === "PRO" ? "$100.000 ARS/mes" : "$50.000 ARS/mes";
    if (confirm(`Redirigiendo a Mercado Pago para suscribirse al Plan ${plan} (${price})...`)) {
      setSimulatedTrialDay(1); // Reset trial to active state on payment
      router.push("/subscription");
    }
  };

  const navGroups = [
    {
      label: "DISCOVER",
      items: [
        {
          name: "Dashboard & Agenda",
          href: "/agenda",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "INVENTARIO",
      items: [
        {
          name: "Stock e Insumos",
          href: "/stock",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
        {
          name: "Remitos",
          href: "/remitos",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "COMERCIAL",
      items: [
        {
          name: "Servicios",
          href: "/services",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.7a6 6 0 01-8.4 8.4l-3.5 3.5a1 1 0 01-1.4-1.4l3.5-3.5a6 6 0 018.4-8.4z" />
            </svg>
          ),
        },
        {
          name: "Facturación ARCA",
          href: "/billing",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          name: "Clientes",
          href: "/customers",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "CONFIGURACIÓN",
      items: [
        {
          name: "Sucursales",
          href: "/branches",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
        {
          name: "Usuarios & Roles",
          href: "/users",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          name: "Pasarelas de Cobro",
          href: "/settings/payment-gateways",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          name: "Mi Suscripción",
          href: "/subscription",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5f8] flex flex-col md:flex-row font-sans text-slate-800 relative">
      {/* Dynamic Fading Black Viewport Overlay (Fades to 100% black between Day 31 and Day 37) */}
      {fadingOpacity > 0 && (
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-700 ${
            isBlackout ? "z-[90] pointer-events-auto" : "z-30 pointer-events-none"
          }`}
          style={{ opacity: fadingOpacity }}
        />
      )}

      {/* Blackout Mode Locks Modal (Day 37+ Full Dark Screen) */}
      {isBlackout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95">
          <div className="w-full max-w-lg bg-[#111216] border border-slate-800 rounded-3xl p-8 space-y-6 text-center shadow-2xl text-white">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold text-3xl flex items-center justify-center mx-auto">
              🔒
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Período de Prueba Finalizado</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Has cumplido los 30 días de prueba iniciales más los 7 días de gracia. La visibilidad ha quedado bloqueada. Suscribite a uno de nuestros planes para desbloquear el acceso inmediatamente.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleQuickSubscribe("PRO")}
                className="w-full ventura-btn-primary py-3.5 rounded-xl font-extrabold text-xs shadow-lg text-[#0f172a]"
              >
                ⚡ Suscribirme al Plan PRO ($100.000 ARS/mes)
              </button>

              <button
                onClick={() => handleQuickSubscribe("STARTER")}
                className="w-full ventura-btn-dark py-3.5 rounded-xl font-bold text-xs border border-slate-700 text-slate-200"
              >
                💳 Suscribirme al Plan STARTER ($50.000 ARS/mes)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ventura Dark Sidebar (Desktop) */}
      <aside className="w-64 bg-[#111216] text-slate-400 p-4 border-r border-slate-800/80 min-h-screen hidden md:flex flex-col justify-between shrink-0 sticky top-0 h-screen z-30">
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="px-2 pt-2 flex items-center space-x-3">
            <div className="w-14 h-14 rounded-2xl bg-[#1c1e24] border border-slate-800 p-0.5 flex items-center justify-center shadow-lg shadow-[#c6f500]/10 shrink-0 overflow-hidden">
              <img src="/assets/vaIcon.svg" alt="VASaaS Logo" className="w-full h-full object-contain scale-140" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">VASaaS</span>
              <span className="block text-[10px] text-[#c6f500] font-bold tracking-widest uppercase">Admin Suite</span>
            </div>
          </div>

          {/* Navigation Groups */}
          <nav className="space-y-6">
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-3 mb-2">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`ventura-sidebar-item ${isActive ? "ventura-sidebar-item-active" : ""}`}
                    >
                      <span className={isActive ? "text-[#c6f500]" : "text-slate-400"}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile Card (Bottom Sidebar) */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#1c1e24] border border-slate-800/60">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#c6f500] text-[#0f172a] font-bold flex items-center justify-center text-xs">
                JC
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">Juan Carlos</p>
                <p className="text-[10px] text-slate-400 truncate">Owner • Barbería</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#c6f500] animate-pulse"></span>
          </div>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <div className="md:hidden bg-[#111216] text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <div className="w-11 h-11 rounded-xl bg-[#1c1e24] border border-slate-800 p-0.5 flex items-center justify-center shadow-md shrink-0 overflow-hidden">
            <img src="/assets/vaIcon.svg" alt="VASaaS Logo" className="w-full h-full object-contain scale-135" />
          </div>
          <span className="font-extrabold text-base tracking-tight">VASaaS</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#111216] p-6 space-y-6 overflow-y-auto">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <span className="font-extrabold text-lg text-white">Menú de Navegación</span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 text-xl font-bold">✕</button>
          </div>
          <nav className="space-y-6">
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-2">
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-xl bg-[#1c1e24] text-slate-200 text-sm font-medium"
                  >
                    <span className="text-[#c6f500]">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Main Canvas Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm shadow-slate-100">
          {/* Left: Global Search Input & Trial Simulation Controller */}
          <div className="flex items-center space-x-3">
            <div className="relative w-64 sm:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar turnos, productos, servicios..."
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-full pl-10 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6f500] transition-all shadow-inner"
              />
            </div>

            {/* Trial Simulator Selector */}
            <div className="hidden lg:flex items-center space-x-1 bg-slate-100 p-1 rounded-full text-[11px] font-bold text-slate-600">
              <span className="px-2 text-[10px] uppercase text-slate-400 font-extrabold">Simular Trial:</span>
              {[15, 30, 32, 34, 37].map((day) => (
                <button
                  key={day}
                  onClick={() => setSimulatedTrialDay(day)}
                  className={`px-2.5 py-0.5 rounded-full transition ${
                    simulatedTrialDay === day
                      ? "bg-[#111216] text-[#c6f500] shadow-sm"
                      : "hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Día {day}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Actions & User Info */}
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sesión Activa
            </span>

            {/* Notification Bell Container */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition focus:outline-none"
                title="Notificaciones"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Functional Notification Dropdown Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-sm text-slate-900">Notificaciones</h3>
                      {unreadCount > 0 && (
                        <span className="bg-[#c6f500] text-[#0f172a] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {unreadCount} nuevas
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No tenés notificaciones pendientes.</p>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border text-xs relative transition flex items-start space-x-2.5 ${
                            item.read
                              ? "bg-slate-50 border-slate-100 text-slate-500"
                              : "bg-blue-50/50 border-blue-100 text-slate-800 font-medium"
                          }`}
                        >
                          <span className="text-base mt-0.5">
                            {item.type === "APPOINTMENT"
                              ? "📅"
                              : item.type === "STOCK"
                              ? "⚠️"
                              : item.type === "BILLING"
                              ? "🧾"
                              : "💳"}
                          </span>
                          <div className="flex-1 pr-4 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-slate-900 text-xs">{item.title}</p>
                              <span className="text-[10px] text-slate-400">{item.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-normal">{item.message}</p>
                          </div>
                          <button
                            onClick={() => handleDismissNotification(item.id)}
                            className="text-slate-400 hover:text-slate-700 font-bold text-xs absolute top-2 right-2"
                            title="Descartar"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900"
                    >
                      Cerrar Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Badge */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#111216] text-[#c6f500] font-bold flex items-center justify-center text-xs shadow-sm">
                JC
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">Juan Carlos</p>
                <p className="text-[10px] font-semibold text-slate-400">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Fading Viewport Grace Period Sticky Banner (Day 31 - Day 36) */}
        {isGracePeriod && !isBlackout && (
          <div className="sticky top-16 z-50 bg-[#111216] text-white p-4 border-b border-[#c6f500]/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-[#c6f500] animate-ping shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-white">
                  ⚠️ Período de Gracia: Día {simulatedTrialDay} de 37 — Disminuyendo visibilidad del panel ({(fadingOpacity * 100).toFixed(0)}% de opacidad oscura)
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  El período de prueba de 30 días ha finalizado. La pantalla se oscurecerá gradualmente durante esta semana hasta quedar completamente negra al día 37.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => handleQuickSubscribe("STARTER")}
                className="ventura-btn-dark px-3.5 py-2 text-xs font-bold border border-slate-700 hover:border-white"
              >
                💳 Plan Starter ($50.000/mes)
              </button>
              <button
                onClick={() => handleQuickSubscribe("PRO")}
                className="ventura-btn-primary px-4 py-2 text-xs font-black shadow-lg"
              >
                ⚡ Plan PRO ($100.000/mes)
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
