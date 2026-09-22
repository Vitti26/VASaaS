import Link from "next/link";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Glassmorphic Navigation Header */}
      <header className="glass-nav sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/agenda" className="flex items-center space-x-2.5 group">
              <span className="bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 text-white p-2 rounded-xl font-black text-sm tracking-wider shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                VA
              </span>
              <span className="font-extrabold text-xl text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                VASaaS
              </span>
            </Link>
            <nav className="hidden md:flex space-x-1">
              <Link
                href="/agenda"
                className="px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition backdrop-blur-sm"
              >
                Agenda
              </Link>
              <Link
                href="/branches"
                className="px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition backdrop-blur-sm"
              >
                Sucursales
              </Link>
              <Link
                href="/users"
                className="px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition backdrop-blur-sm"
              >
                Usuarios & Roles
              </Link>
              <Link
                href="/customers"
                className="px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition backdrop-blur-sm"
              >
                Clientes
              </Link>
              <Link
                href="/services"
                className="px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition backdrop-blur-sm"
              >
                Servicios
              </Link>
              <Link
                href="/billing"
                className="px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition backdrop-blur-sm"
              >
                Facturación AFIP
              </Link>
              <Link
                href="/stock"
                className="px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition backdrop-blur-sm"
              >
                Stock e Insumos
              </Link>
              <Link
                href="/remitos"
                className="px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition backdrop-blur-sm"
              >
                Remitos
              </Link>
              <Link
                href="/subscription"
                className="px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition backdrop-blur-sm"
              >
                Mi Suscripción
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Sesión Activa
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
