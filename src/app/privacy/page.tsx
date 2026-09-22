import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col p-4 sm:p-8 selection:bg-blue-500 selection:text-white">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-white transition">Inicio</Link>
          <span>/</span>
          <span className="text-white font-medium">Política de Privacidad</span>
        </div>

        <div className="border-b border-white/10 pb-6 space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Política de Privacidad y Protección de Datos</h1>
          <p className="text-xs text-slate-400">Última actualización: Septiembre 2026 • Ley 25.326 República Argentina</p>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 text-xs text-slate-300 leading-relaxed border-white/10">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Compromiso de Privacidad</h2>
            <p>
              En VASaaS (&quot;la Plataforma&quot;), protegemos y garantizamos la confidencialidad, privacidad y seguridad de los datos personales y comerciales recopilados durante el uso de nuestras herramientas de agenda, turnos, stock y facturación electrónica, en estricto cumplimiento con la Ley Nº 25.326 de Protección de Datos Personales de la República Argentina.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Información Recopilada y Cifrado</h2>
            <p>
              Recopilamos información necesaria para la gestión operativa y fiscal de los negocios clientes: datos de contacto, identificadores fiscales (CUIT/CUIL), información de facturación y registros de turnos. Toda la información en tránsito se cifra mediante protocolos <strong>HTTPS/TLS 1.3</strong>. Las credenciales sensibles y certificados digitales se resguardan encriptados en reposo mediante algoritmos <strong>AES-256-GCM</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Aislamiento Multi-Tenant y Titularidad de los Datos</h2>
            <p>
              Cada suscriptor posee un espacio aislado (tenant isolation) que impide el acceso no autorizado de terceros a su información. Los datos pertenecerán siempre al cliente. VASaaS no vende, alquila ni comparte información con terceros para fines comerciales o publicitarios.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Integración con ARCA / Mercado Pago</h2>
            <p>
              Los datos requeridos para la emisión fiscal de comprobantes son transmitidos exclusivamente a la Agencia de Recaudación y Control Aduanero (ARCA / ex-AFIP) mediante servicios web autorizados (WSAA / WSFE). Los procesamientos de cobro se ejecutan mediante pasarelas de pago auditadas como Mercado Pago bajo estrictas normas de seguridad PCI-DSS.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</h2>
            <p>
              El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses. Para ejercer los derechos de rectificación, actualización o supresión de datos, puede contactarse a nuestro soporte a través de la plataforma. La Agencia de Acceso a la Información Pública (AAIP) es el Órgano de Control de la Ley N° 25.326.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
