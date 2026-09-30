# Runbook de Incidentes - VASaaS

Este documento describe los procedimientos de respuesta rápida para incidentes comunes en producción para la plataforma VASaaS, diseñada bajo arquitectura Multi-tenant.

## 1. Incidente: Un tenant ve datos de otro tenant
**Severidad:** CRÍTICA (Fuga de datos)

**Síntomas:** Un usuario reporta que en su agenda o lista de clientes aparecen personas que no conoce, o que facturas que no emitió aparecen en su panel.
**Causa probable:** Rotura en el aislamiento Multi-tenant (`tenantId` no fue inyectado correctamente en el contexto o se confió en un payload del cliente).

**Procedimiento de respuesta:**
1. **Contención inmediata (Kill Switch):**
   - Habilitar modo mantenimiento global o deshabilitar temporalmente los endpoints afectados.
   - En Vercel: hacer un Rollback inmediato a la última versión estable (Deployment previo seguro) desde el panel.
2. **Diagnóstico:**
   - Buscar en los logs recientes (Axiom / Vercel Logs) el identificador del usuario que reportó.
   - Revisar qué Server Action o API Route se utilizó y verificar cómo se obtuvo el `tenantId`.
   - **Regla de oro:** El `tenantId` **NUNCA** debe venir del body/query de la request, sino obligatoriamente desde `resolveTenantContext(sessionToken)`.
3. **Resolución:**
   - Parchear la validación y forzar que la consulta SQL / Prisma lleve el `where: { tenantId: ctx.tenantId }`.
   - Correr tests de integración localmente (`npm run test:integration`) asegurando que el caso de aislamiento cubra esa ruta.
4. **Post-mortem:**
   - Avisar a los clientes potencialmente afectados de acuerdo a las regulaciones de protección de datos.
   - Revisar si el atacante fue malicioso o fue un error de interfaz (cache cruzado).

---

## 2. Incidente: Webhook de Mercado Pago reintentando masivamente (Bucle / DDoS)
**Severidad:** ALTA

**Síntomas:** El dashboard de Mercado Pago muestra cientos de reintentos fallidos; la base de datos presenta un uso de CPU muy alto, o Vercel factura exceso de invocaciones Edge/Serverless.
**Causa probable:** El webhook está retornando status `5xx` o `4xx` (por error en el código, timeouts de DB, o un caso no manejado).

**Procedimiento de respuesta:**
1. **Contención inmediata:**
   - Pausar los webhooks en el panel de Mercado Pago temporalmente si el volumen amenaza con tirar abajo la DB, o configurar una regla en Vercel Firewall / WAF para rate limit de la ruta `/api/webhooks/mercadopago`.
2. **Diagnóstico:**
   - Verificar los logs del endpoint de webhook. Si dice "Idempotencia fallida", verificar el modelo `ProcessedWebhookEvent`.
   - Si el webhook falla por timeouts en la validación de suscripciones con MP API (`fetch` a MP), verificar si la API de Mercado Pago está caída.
3. **Resolución:**
   - Envolver la operación en try/catch y asegurar retornar **siempre** HTTP 200 a Mercado Pago (o HTTP 400 controlados si el payload es irreconocible) para que MP detenga el backoff. Los errores deben loguearse internamente y no crashear la lambda.
   - Procesar manualmente los eventos atrasados si quedaron encolados.

---

## 3. Incidente: Abuso de Rate Limiter (Spam de Reservas)
**Severidad:** MEDIA

**Síntomas:** Un tenant o múltiples tenants reciben cientos de turnos fantasma en pocos minutos; la tabla de `Appointment` crece desmesuradamente.
**Causa probable:** Un ataque de bot automatizado que bypassó el `checkIpBookingRateLimit` rotando IPs o el rate limiter falló por problemas de conexión a la base de datos (Postgres).

**Procedimiento de respuesta:**
1. **Contención inmediata:**
   - Bloquear el/los `tenantSlug` temporalmente de aceptar reservas públicas mediante una flag de emergencia, o habilitar Captcha (ej. Cloudflare Turnstile) en modo estricto.
2. **Limpieza:**
   - Borrar las reservas spam (identificables por IP, patrón de nombre, timestamp).
   - Utilizar el log de `RateLimitAttempt` para identificar y bloquear subredes IP (CIDR) abusivas en el WAF (Web Application Firewall).
3. **Resolución preventiva:**
   - Reducir los umbrales del rate limiter en `rate-limiter.ts` (ej. de 5/min a 2/min).

---

## 4. Incidente: Expiración masiva errónea de Trial (Cierre Inesperado de Cuentas)
**Severidad:** CRÍTICA (Interrupción de Negocio)

**Síntomas:** Cientos de tenants válidos (incluso los que pagaron) de repente ven la pantalla de "Blackout" (bloqueo total) o banner de Gracia.
**Causa probable:** El cálculo de `isBlackout` y `isGracePeriod` falló por un bug de fechas, zona horaria (UTC vs Local), o un webhook canceló erróneamente suscripciones válidas.

**Procedimiento de respuesta:**
1. **Contención inmediata:**
   - En `layout.tsx`, forzar un bypass: `const isBlackout = false; const isGracePeriod = false;` temporalmente. Desplegar de urgencia para restaurar el servicio.
2. **Diagnóstico y Resolución:**
   - Revisar la tabla de `Subscription`. Si los status cambiaron a `PAST_DUE` incorrectamente, correr un script masivo consultando la API de MP para sincronizar estados reales de nuevo a la base de datos.
   - Corregir el bug subyacente en la lógica de `trialEndsAt` / `Date.now()`.
3. **Post-mortem:**
   - Compensar a los usuarios (ofrecer días gratis o descuento) por el downtime, ya que esto impacta severamente sus ingresos diarios.
