import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f4f5f8] text-slate-800 font-sans flex flex-col selection:bg-[#c6f500] selection:text-slate-900">
      {/* Top Header Navigation Bar */}
      <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-xl bg-[#111216] border border-slate-800 p-1 flex items-center justify-center shadow-md overflow-hidden shrink-0">
              <img src="/assets/vaIcon.svg" alt="VASaaS Logo" className="w-full h-full object-contain scale-125" />
            </div>
            <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
              VASaaS
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-600">
            <a href="#funcionalidades" className="hover:text-slate-900 transition">Turnos</a>
            <a href="#funcionalidades" className="hover:text-slate-900 transition">Facturación</a>
            <a href="#funcionalidades" className="hover:text-slate-900 transition">Remitos</a>
            <a href="#funcionalidades" className="hover:text-slate-900 transition">Stock & Servicios</a>
            <a href="#planes" className="hover:text-slate-900 transition">Planes</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              href="/agenda"
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 transition shadow-md"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition shadow-sm"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl text-xs font-black text-[#0f172a] bg-[#c6f500] hover:bg-[#b8e600] transition shadow-md shadow-[#c6f500]/20"
            >
              Probar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-16">

        {/* Hero Section */}
        <section className="text-center space-y-8 max-w-4xl mx-auto pt-4">
          <div className="inline-block">
            <span className="px-4 py-1.5 rounded-full bg-[#dcfc45]/40 text-[#4d7000] border border-[#a8e600]/40 text-xs font-extrabold tracking-wide">
              Turnos • Facturación AFIP • Remitos • Stock
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Turnos, Facturación y Logística
              <span className="block text-[#7bb800]">Sin planillas ni retrasos operativos</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
              El SaaS integral que automatiza la agenda, facturación fiscal, comprobantes de entrega y stock en tiempo real desde un único panel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/agenda"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-black text-[#0f172a] bg-[#c6f500] hover:bg-[#b8e600] transition shadow-lg shadow-[#c6f500]/30"
            >
              Ingresar al Dashboard
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-extrabold text-white bg-slate-900 hover:bg-slate-800 transition shadow-md"
            >
              Crear Mi Negocio
            </Link>
            <Link
              href="/b/barberia-central/palermo"
              target="_blank"
              className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 transition shadow-sm"
            >
              Probar Booking Público
            </Link>
          </div>
        </section>

        {/* 6 Feature Cards Grid */}
        <section id="funcionalidades" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition">
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900">Agenda & Turnos</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gestión de turnos simultáneos por profesional y recordatorios automáticos por WhatsApp.
              </p>
            </div>
            <span className="bg-[#eefc9d] text-[#557a00] text-[11px] font-bold px-3 py-1 rounded-full w-fit">
              40% menos ausentismo
            </span>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition">
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900">Facturación Fiscal</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Emisión electrónica instantánea A, B y C con CAE automático de AFIP y cobros con QR.
              </p>
            </div>
            <span className="bg-[#eefc9d] text-[#557a00] text-[11px] font-bold px-3 py-1 rounded-full w-fit">
              CAE en 1 clic
            </span>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition">
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900">Remitos de Entrega</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Seguimiento de despachos con firma digital móvil y conversión a factura automática.
              </p>
            </div>
            <span className="bg-[#eefc9d] text-[#557a00] text-[11px] font-bold px-3 py-1 rounded-full w-fit">
              Trazabilidad 100%
            </span>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition">
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900">Control de Stock</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Descuento en tiempo real al facturar y alertas de stock crítico por depósito.
              </p>
            </div>
            <span className="bg-[#eefc9d] text-[#557a00] text-[11px] font-bold px-3 py-1 rounded-full w-fit">
              Multidepósito
            </span>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition">
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900">Catálogo de Servicios</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Márgenes de ganancia, tiempos operativos y comisiones de equipo automatizadas.
              </p>
            </div>
            <span className="bg-[#eefc9d] text-[#557a00] text-[11px] font-bold px-3 py-1 rounded-full w-fit">
              Rentabilidad neta
            </span>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition">
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900">Reportes y Dashboard</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Flujo de caja proyectado, reportes de facturación y balance consolidado diario.
              </p>
            </div>
            <span className="bg-[#eefc9d] text-[#557a00] text-[11px] font-bold px-3 py-1 rounded-full w-fit">
              Visión 360°
            </span>
          </div>
        </section>

        {/* Live Operational Dashboard Mock Preview */}
        <section id="dashboard-preview" className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[500px]">

            {/* Left Sidebar Mock */}
            <div className="w-full lg:w-64 bg-[#111216] text-slate-400 p-6 flex flex-col justify-between space-y-6 shrink-0 border-r border-slate-800">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#c6f500] text-[#0f172a] font-black flex items-center justify-center text-xs">
                    VA
                  </div>
                  <span className="font-extrabold text-white text-base">VASaaS Pro</span>
                </div>

                <nav className="space-y-1 text-xs font-semibold">
                  <div className="p-2.5 rounded-xl bg-slate-800/90 text-[#c6f500] font-bold flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#c6f500]" />
                    <span>Turnos Diarios</span>
                  </div>
                  <div className="p-2.5 rounded-xl hover:bg-slate-800/40 text-slate-400 hover:text-white transition">
                    Facturación CAE
                  </div>
                  <div className="p-2.5 rounded-xl hover:bg-slate-800/40 text-slate-400 hover:text-white transition">
                    Remitos Activos
                  </div>
                  <div className="p-2.5 rounded-xl hover:bg-slate-800/40 text-slate-400 hover:text-white transition">
                    Stock e Insumos
                  </div>
                  <div className="p-2.5 rounded-xl hover:bg-slate-800/40 text-slate-400 hover:text-white transition">
                    Servicios y Tarifas
                  </div>
                  <div className="p-2.5 rounded-xl hover:bg-slate-800/40 text-slate-400 hover:text-white transition">
                    Configuración
                  </div>
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                Sucursal Central Palermo
              </div>
            </div>

            {/* Right Main Content Mock */}
            <div className="flex-1 bg-[#f8fafc] p-6 sm:p-8 space-y-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Panel Operativo de Control
              </h2>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">TURNOS HOY</span>
                  <div className="text-2xl font-black text-slate-900">28</div>
                  <span className="text-[11px] font-bold text-emerald-600 block">94% confirmados</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">FACTURACIÓN AFIP</span>
                  <div className="text-2xl font-black text-slate-900">$842.500</div>
                  <span className="text-[11px] font-bold text-emerald-600 block">+18.4% vs promedio</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">REMITOS EN RUTA</span>
                  <div className="text-2xl font-black text-slate-900">14</div>
                  <span className="text-[11px] font-bold text-emerald-600 block">4 entregados</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">STOCK CRÍTICO</span>
                  <div className="text-2xl font-black text-slate-900">3 ítems</div>
                  <span className="text-[11px] font-bold text-rose-600 block">Reposición requerida</span>
                </div>
              </div>

              {/* Recent Transactions Table Mock */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 overflow-x-auto">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Últimos Movimientos: Turnos, Remitos y Facturas
                </h3>

                <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-2">HORA</th>
                      <th className="py-2.5 px-2">CLIENTE / EMPRESA</th>
                      <th className="py-2.5 px-2">CONCEPTO OPERATIVO</th>
                      <th className="py-2.5 px-2">COMPROBANTE ARP</th>
                      <th className="py-2.5 px-2 text-right">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    <tr>
                      <td className="py-3 px-2 font-bold text-slate-900">14:30 hs</td>
                      <td className="py-3 px-2">Transportes Andinos S.A.</td>
                      <td className="py-3 px-2">Mantenimiento Flota + Filtros</td>
                      <td className="py-3 px-2 font-mono text-[11px]">Factura A-0004-00129</td>
                      <td className="py-3 px-2 text-right">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">Emitida</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-bold text-slate-900">15:15 hs</td>
                      <td className="py-3 px-2">Estudio Contable Vega</td>
                      <td className="py-3 px-2">Servicio Mensual de Asesoría</td>
                      <td className="py-3 px-2 font-mono text-[11px]">Factura B-0004-00431</td>
                      <td className="py-3 px-2 text-right">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">Emitida</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-bold text-slate-900">16:00 hs</td>
                      <td className="py-3 px-2">Distribuidora del Plata</td>
                      <td className="py-3 px-2">Despacho de Insumos (30 un.)</td>
                      <td className="py-3 px-2 font-mono text-[11px]">Remito R-0002-00084</td>
                      <td className="py-3 px-2 text-right">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold">En Reparto</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-bold text-slate-900">16:45 hs</td>
                      <td className="py-3 px-2">Taller Industrial Norte</td>
                      <td className="py-3 px-2">Reparación y Calibración Torno</td>
                      <td className="py-3 px-2 font-mono text-[11px]">Factura A-0004-00130</td>
                      <td className="py-3 px-2 text-right">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">Emitida</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-bold text-slate-900">17:30 hs</td>
                      <td className="py-3 px-2">Clínica Médica Central</td>
                      <td className="py-3 px-2">Servicio Periódico de Guardias</td>
                      <td className="py-3 px-2 font-mono text-[11px] text-slate-400">Pendiente CAE</td>
                      <td className="py-3 px-2 text-right">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">Por Facturar</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Subscriptions Section */}
        <section id="planes" className="pt-8 space-y-8 text-center">
          <div className="space-y-2">
            <span className="text-[#649600] text-xs font-black uppercase tracking-widest">
              Planes de Suscripción Recurrente
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Elegí el plan perfecto para escalar tu empresa
            </h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Todos los planes incluyen 30 días de prueba gratuita sin compromiso. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-4 text-left">
            {/* Starter Plan Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-900">Plan STARTER</h3>
                  <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Inicial
                  </span>
                </div>
                <p className="text-xs text-slate-500">Perfecto para pequeños comercios y negocios monosucursal.</p>
                <div className="text-4xl font-black text-slate-900 tracking-tight">
                  $50.000 <span className="text-xs font-normal text-slate-500">ARS / mes</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-3 border-t border-slate-100 pt-5 font-medium">
                  <li className="flex items-center gap-2">✓ 1 Sucursal incluida</li>
                  <li className="flex items-center gap-2">✓ Hasta 3 Usuarios Staff</li>
                  <li className="flex items-center gap-2">✓ Agenda de turnos + Booking Público</li>
                  <li className="flex items-center gap-2">✓ Control de stock por sucursal</li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">✕ Facturación Electrónica ARCA/AFIP</li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition text-center shadow-md block"
              >
                Suscribirme a STARTER (30 días Gratis)
              </Link>
            </div>

            {/* Pro Plan Card */}
            <div className="bg-white p-8 rounded-3xl border-2 border-[#c6f500] shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#c6f500] text-[#0f172a] text-[10px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-wider">
                Recomendado
              </div>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-900">Plan PRO</h3>
                </div>
                <p className="text-xs text-slate-500">Para negocios en expansión multi-sucursal y facturación fiscal.</p>
                <div className="text-4xl font-black text-slate-900 tracking-tight">
                  $100.000 <span className="text-xs font-normal text-slate-500">ARS / mes</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-3 border-t border-slate-100 pt-5 font-semibold">
                  <li className="flex items-center gap-2 text-[#649600] font-bold">✓ Multi-Sucursal Ilimitado</li>
                  <li className="flex items-center gap-2 text-[#649600] font-bold">✓ Facturación Electrónica ARCA (Facturas A, B, C)</li>
                  <li className="flex items-center gap-2">✓ Usuarios Staff y Administración Ilimitados</li>
                  <li className="flex items-center gap-2">✓ Módulo de Remitos y Despacho</li>
                  <li className="flex items-center gap-2">✓ Soporte Prioritario 24/7</li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3.5 rounded-xl font-black text-xs bg-[#c6f500] hover:bg-[#b8e600] transition shadow-lg text-center block text-[#0f172a]"
              >
                Suscribirme al Plan PRO (30 días Gratis)
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500 space-y-3">
        <div className="flex items-center justify-center space-x-6 font-medium">
          <Link href="/login" className="hover:text-slate-900">Iniciar Sesión</Link>
          <Link href="/register" className="hover:text-slate-900">Registrar Negocio</Link>
          <Link href="/terms" className="hover:text-slate-900">Términos y Condiciones</Link>
          <Link href="/privacy" className="hover:text-slate-900">Política de Privacidad</Link>
        </div>
        <p>© 2026 VASaaS. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
