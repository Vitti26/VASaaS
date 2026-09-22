import React from "react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col p-4 sm:p-8 selection:bg-blue-500 selection:text-white">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-white transition">Inicio</Link>
          <span>/</span>
          <span className="text-white font-medium">Términos y Condiciones</span>
        </div>

        <div className="border-b border-white/10 pb-6 space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Términos y Condiciones de Servicio</h1>
          <p className="text-xs text-slate-400">Última actualización: Septiembre 2026 • Argentina</p>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 text-xs text-slate-300 leading-relaxed border-white/10">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Aceptación del Servicio</h2>
            <p>
              Al registrarse y utilizar la plataforma VASaaS (&quot;el Servicio&quot;), usted (&quot;el Suscriptor&quot; o &quot;el Negocio&quot;) acepta quedar vinculado por los presentes Términos y Condiciones. El Servicio es un Software como Servicio (SaaS) multi-tenant destinado a la gestión integral de agenda, turnos, inventario de stock y facturación electrónica.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Propiedad de los Datos y Resguardo (Bloqueo Suave)</h2>
            <p>
              El Suscriptor es el único propietario de toda la información cargada en el Servicio (datos de clientes, turnos, facturas y movimientos de stock). En caso de mora o cancelación del plan de pago, el Servicio aplica la política de <strong>Bloqueo Suave</strong>: la cuenta pasará a modo solo lectura, permitiendo consultar y exportar los datos. Bajo ninguna circunstancia los datos del Suscriptor serán eliminados por falta de pago.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Integración con ARCA / AFIP</h2>
            <p>
              La emisión de comprobantes fiscales electrónicos (Facturas A, B, C y Notas de Crédito) se realiza mediante los Web Services oficiales de ARCA (ex-AFIP) utilizando el CUIT y los certificados digitales registrados por el Suscriptor. El Suscriptor es el único responsable por la exactitud de las declaraciones fiscales y el cumplimiento de las normativas vigentes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Disponibilidad (SLA) y Seguridad</h2>
            <p>
              VASaaS garantiza un nivel de disponibilidad del servicio del 99.5% mensual. Toda la información en tránsito se cifra mediante HTTPS/TLS, y los certificados y claves privadas se almacenan cifrados mediante AES-256-GCM.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
