import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="max-w-4xl space-y-8 z-10">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <span className="bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 text-white p-3 rounded-2xl font-black text-xl tracking-wider shadow-xl shadow-blue-500/30">
            VA
          </span>
          <span className="font-extrabold text-4xl text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            VASaaS
          </span>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 text-sm font-semibold text-blue-400 border border-blue-500/30 shadow-lg">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping"></span>
          Plataforma SaaS Multi-Tenant & Multi-Sucursal para Pequeños Negocios
        </span>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl leading-tight">
          Gestión de Agenda, Facturación AFIP y Control de Stock
        </h1>

        <p className="text-lg leading-relaxed text-slate-300 max-w-2xl mx-auto">
          La solución integral diseñada para peluquerías, consultorios, talleres mecánicos y comercios de cercanía en Argentina.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            href="/agenda"
            className="glass-btn-primary px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-xl text-white"
          >
            🚀 Ingresar al Dashboard
          </Link>
          <Link
            href="/b/barberia-central/palermo"
            target="_blank"
            className="glass-btn-secondary px-6 py-3.5 rounded-xl font-medium text-sm text-slate-200"
          >
            🔗 Probar Booking Público
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 pt-8 sm:grid-cols-3">
          <div className="glass-card p-6 text-left rounded-2xl space-y-2">
            <div className="text-2xl">📅</div>
            <h3 className="text-lg font-bold text-white">1. Agenda de Turnos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gestión interna por profesional/sucursal y link público de reservas para clientes finales sin login.
            </p>
          </div>
          <div className="glass-card p-6 text-left rounded-2xl space-y-2">
            <div className="text-2xl">📦</div>
            <h3 className="text-lg font-bold text-white">2. Control de Stock</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inventario por sede, productos de reventa e insumos consumidos mediante recetas de servicios.
            </p>
          </div>
          <div className="glass-card p-6 text-left rounded-2xl space-y-2">
            <div className="text-2xl">⚡</div>
            <h3 className="text-lg font-bold text-white">3. Facturador AFIP</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Emisión de Facturas A/B/C integradas al cobro semiautomático del turno con obtención de CAE.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
