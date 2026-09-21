# Reporte de Auditoría de Seguridad - VASaaS (Fase 10)

> **Fecha:** 21 de Septiembre, 2026  
> **Objetivo:** Identificación y mitigación de vulnerabilidades de seguridad, control de aislamiento multi-tenant, protección del portal público de reservas y evaluación de dependencias.

---

## 1. Resumen Ejecutivo

Se realizó una auditoría completa de seguridad sobre el código base de VASaaS, evaluando:
- Aislamiento de datos entre tenants (IDOR y fugas multitenant).
- Protección de endpoints públicos (Portal de reservas `/b/[tenantSlug]/[branchSlug]`).
- Auditoría de dependencias (`npm audit`).
- Almacenamiento e higienización de secretos en variables de entorno.
- Sanitización de entradas del usuario (XSS, inyección Zod).

---

## 2. Hallazgos y Acciones Remediales

| Severidad | Tipo | Descripción del Hallazgo | Archivo Afectado | Acción Remedial Implementada |
|---|---|---|---|---|
| **Alta** | Rate Limit / DoS | El portal público de reservas no tenía límite de peticiones por IP ni por Tenant, permitiendo spam de turnos masivo. | `src/app/b/[tenantSlug]/[branchSlug]/page.tsx` | Se creó `rate-limiter.ts` aplicando ventana deslizante (sliding window) por IP y por Tenant. |
| **Alta** | Bot / Spam | Un script automatizado podía registrar cientos de turnos ficticios con números aleatorios en segundos. | `src/modules/agenda/actions.ts` | Se agregó honeypot anti-bot, tiempo mínimo de completado de formulario y límite de 3 turnos activos por teléfono. |
| **Media** | Sanitización / XSS | Las observaciones y nombres del cliente en reservas públicas no filtraban caracteres HTML/Scripts. | `src/modules/agenda/domain/appointment.ts` | Se agregaron transformaciones Zod para remover etiquetas HTML y sanitizar strings. |
| **Media** | Webhook Spoofing | El webhook de Mercado Pago no verificaba firma o token secreto en headers. | `src/app/api/webhooks/mercadopago/route.ts` | Se agregó verificación opcional de header `x-webhook-secret` o token de autenticación de webhook. |
| **Baja** | `npm audit` | Alertas moderadas/altas en dependencias de desarrollo (`postcss`, `next`, `vitest`). | `package.json` | Auditoría realizada. Se verificó que son en herramientas de build/dev server local, no expuestas en bundle cliente. |

---

## 3. Matriz de Controles de Seguridad Activos

1. **Aislamiento Multi-Tenant:**
   - Todos los repositorios Prisma filtran obligatoriamente por `tenantId`.
   - Las sesiones JWT (`vasaas_session`) se firman con algoritmo `HS256` y expiración de 24 horas.
   - Las cookies son `httpOnly`, `sameSite: lax` y `secure` en producción.

2. **Protección Anti-Bot en Reservas Públicas:**
   - **Honeypot field:** Campo oculta `website` que atrapa scripts automatizados.
   - **Form timestamp:** Rechaza envíos en menos de 1.2 segundos (humanamente imposible).
   - **Rate limiting:** Máximo 5 reservas por minuto por dirección IP.
   - **Quota por Teléfono:** Máximo 3 turnos vigentes por número telefónico por tenant.

3. **Inmutabilidad y Auditoría:**
   - Facturas y comprobantes fiscales no admiten edición ni borrado (`audit-service.ts`).
