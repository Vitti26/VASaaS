import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaaS Multi-Tenant - Gestión de Turnos, Stock y Facturación",
  description: "Plataforma integral para pequeños negocios: agenda de turnos, facturación AFIP y control de stock multi-sucursal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
