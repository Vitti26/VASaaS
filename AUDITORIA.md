# Auditoría VASaaS — Hallazgos y plan de corrección

> Generado revisando el código real del repo `Vitti26/VASaaS` (rama `main`), archivo por archivo.
> No son suposiciones: cada hallazgo tiene el archivo, la línea y por qué es un problema.
> Regla para Antigravity: **no marques nada como "arreglado" sin mostrar la prueba** (test, log, o captura). Varios de estos ítems ya se pidieron corregir en una vuelta anterior y siguen exactamente igual.

---

## 🔴 Hallazgo más importante: el dashboard no está conectado a la base de datos

Antes de entrar en seguridad, esto es lo que más importa para el negocio: de las 9 pantallas del panel, **8 son maquetas con datos inventados en el propio componente**, no leen ni escriben nada real.

| Página | Llama a una Action real | Estado |
|---|:---:|---|
| `agenda/page.tsx` | Sí (parcial, ver hallazgo de contaminación de datos más abajo) | Parcialmente real |
| `billing/page.tsx` | No | 100% maqueta |
| `branches/page.tsx` | No | 100% maqueta |
| `customers/page.tsx` | No | 100% maqueta |
| `services/page.tsx` | No | 100% maqueta |
| `settings/payment-gateways/page.tsx` | No | 100% maqueta |
| `stock/page.tsx` | No | 100% maqueta |
| `subscription/page.tsx` | No | 100% maqueta |
| `users/page.tsx` | No | 100% maqueta |

Ejemplo concreto, `customers/page.tsx`:

```tsx
const [customers, setCustomers] = useState<CustomerItem[]>([
  { id: "1", name: "Carlos Gómez", ... },
  { id: "2", name: "Empresa Ejemplo S.A.", ... },
]);
```

Esto es una lista fija escrita en el componente. Si dos negocios distintos entran a `/customers`, **los dos ven exactamente los mismos dos clientes inventados**, y si agregan uno nuevo, se pierde al recargar la página porque nunca se guarda en ningún lado.

Lo llamativo es que **el backend real de estos módulos ya existe y parece bien hecho** (`src/modules/customers/actions.ts`, `domain/customer-service.ts`, `infrastructure/prisma-customer-repository.ts`, con sus tests). El trabajo de conectar la pantalla al backend quedó pendiente en los 8 módulos. Esto es la razón real detrás de la pregunta "¿ya está el front o falta?" de hace unos días: **no está**, a pesar de que el reporte de estado decía "✅ COMPLETADO" en todos.

**Corrección:** por cada página, reemplazar el `useState` con datos hardcodeados por una carga real desde su Action correspondiente (Server Component que llama a la action, o `useEffect` + Server Action si necesita quedar como client component), y conectar los formularios de alta/edición a las actions de escritura que ya existen.

---

## 🔴 Crítico: no hay ninguna verificación de sesión en el panel

Revisé `src/app/(dashboard)/layout.tsx` completo: es un componente `"use client"` que no llama a `resolveTenantContext`, no lee cookies, no redirige a `/login`. Y no existe ningún `middleware.ts` en el proyecto.

```tsx
// (dashboard)/layout.tsx — no hay ninguna verificación antes de esto
<p className="text-xs font-bold text-white truncate">Juan Carlos</p>
<p className="text-[10px] text-slate-400 truncate">Owner • Barbería</p>
```

El nombre "Juan Carlos" y el rol "Owner" están **escritos a mano en el código**, no vienen de la sesión real. Ahora mismo, **cualquier persona que entre directo a `tu-dominio/agenda`, `/customers`, `/stock`, etc. sin haber iniciado sesión, ve el panel completo**. El login sí genera una cookie httpOnly válida (`auth/actions.ts` está bien hecho ahí), pero nada la verifica del lado del panel.

**Corrección:**
1. Crear `middleware.ts` en la raíz del proyecto que intercepte todas las rutas bajo `(dashboard)` y `/settings`, llame a `resolveTenantContext` con la cookie de sesión, y redirija a `/login` si no hay sesión válida.
2. Además del middleware, cada Server Action de escritura (crear cliente, editar stock, etc.) debe llamar `resolveTenantContext` de nuevo puertas adentro — nunca confiar solo en que el middleware ya filtró.
3. Sacar los datos hardcodeados de usuario/rol del sidebar y traerlos de la sesión real (`getCurrentSessionAction`).
4. Sacar el selector "Simular Trial: Día 15/30/32/34/37" del sidebar — es un control de testing que quedó visible para cualquier usuario real en producción, y permite a cualquiera "resetear" visualmente su período de prueba con un clic.

---

## 🔴 Crítico: los mismos secretos hardcodeados que pedimos sacar, siguen igual

Esto ya se había marcado como prioridad 0 y **no se tocó**.

**`src/modules/shared/infrastructure/tenant-context.ts` línea 5:**
```ts
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-development-tests-only-min-32-chars"
);
```

**`src/modules/shared/infrastructure/fiscal-crypto.ts` línea 4:**
```ts
const DEFAULT_KEY_PHRASE = process.env.FISCAL_ENCRYPTION_KEY || "vasaas-fiscal-secret-key-32-bytes-long!";
```

Como el repo es público, estos dos valores de respaldo los puede leer cualquiera en GitHub. Si en Vercel falta la variable de entorno correspondiente (o quedó cargada con el valor de ejemplo tal cual), cualquiera puede:
- Firmar un JWT válido y entrar como OWNER de cualquier negocio (con `JWT_SECRET`).
- Descifrar los certificados fiscales guardados de cualquier tenant (con `FISCAL_ENCRYPTION_KEY`), ya que `encryptFiscalSecret`/`decryptFiscalSecret` caen a este valor si la variable no está.

**Corrección:** sacar el `||` de respaldo en los dos archivos. Si la variable de entorno no está, la app tiene que fallar fuerte al arrancar (`throw new Error(...)`), nunca seguir con un valor por defecto.

```ts
const secretValue = process.env.JWT_SECRET;
if (!secretValue) throw new Error("JWT_SECRET no configurado");
const JWT_SECRET = new TextEncoder().encode(secretValue);
```

---

## 🔴 Crítico: el checkout de Mercado Pago sigue sin conectar (esto también se pidió antes)

`src/app/(dashboard)/subscription/page.tsx` sigue con:

```ts
const handleSubscribeMercadoPago = async (plan) => {
  alert(`Redirigiendo a Mercado Pago...`);
  setCurrentPlan(plan);
};
```

El cliente real (`mercadopago-client.ts`, función `createSubscriptionCheckout`) **no se usa en ningún lado del código** fuera de su propio archivo y su test. Sigue siendo exactamente el mismo problema de la vez pasada.

**Corrección:** la que ya te habíamos dejado escrita:
1. Server Action que tome el tenant de la sesión (nunca del cliente), llame a `createSubscriptionCheckout`, guarde el `mpSubscriptionId` en la tabla `Subscription`.
2. El botón debe hacer `window.location.href = initPoint` con el resultado real, no un `alert`.

---

## 🔴 Crítico: el webhook de Mercado Pago confía en datos que manda quien llama, no en Mercado Pago

`src/app/api/webhooks/mercadopago/route.ts`:

```ts
const webhookSecret = process.env.MP_WEBHOOK_SECRET;
if (webhookSecret && !verifyMercadoPagoWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
  return NextResponse.json({ error: "Firma de webhook inválida" }, { status: 401 });
}
```

Dos problemas serios, uno arriba del otro:

1. **Si `MP_WEBHOOK_SECRET` no está configurada, la verificación de firma se salta por completo** (`if (webhookSecret && ...)`), y el webhook procesa cualquier cosa que le llegue como si fuera legítima.
2. **Incluso con la firma bien verificada, el diseño está mal.** El schema del body exige que quien llama mande `tenantId`, `newStatus` y `plan` directamente:
   ```ts
   const MercadoPagoWebhookBodySchema = z.object({
     ...
     tenantId: z.string().min(1),
     newStatus: z.enum([...]),
     plan: z.enum([...]),
   });
   ```
   Mercado Pago **no manda esto en sus webhooks reales** — manda solo un aviso con un `id`, y el sistema tiene que usar ese `id` para preguntarle a la API de Mercado Pago cuál es el estado real, y de ahí buscar en tu propia base a qué tenant corresponde. Tal como está, **cualquiera que sepa el `tenantId` de un negocio (son visibles en las URLs públicas de reserva) puede mandar un POST directo a este endpoint y activarle el Plan PRO gratis**, sin pasar por Mercado Pago en absoluto.

**Corrección:**
1. Sacar el `if (webhookSecret && ...)`: si la variable no está configurada, rechazar la request, no dejarla pasar.
2. Rediseñar el webhook: recibir solo `{ type, data: { id } }`, con ese `id` llamar a la API de Mercado Pago (`GET /preapproval/{id}`) desde el servidor para obtener el estado real, y buscar el tenant por el `mpSubscriptionId` guardado en tu base (no confiar en un `tenantId` que venga en el body).
3. Además, `processedWebhookEvents` (`mercadopago-webhook.ts`) es un `Set` en memoria. En Vercel (serverless) cada invocación puede correr en una instancia distinta, así que esta deduplicación **no funciona de forma confiable en producción** — un mismo evento reenviado por Mercado Pago se puede procesar más de una vez. Guardar el estado de idempotencia en la base de datos (una tabla o columna con el último `event_id` procesado por tenant), no en memoria.

---

## 🔴 Crítico: filtración de datos entre negocios distintos, con datos falsos mezclados

Este es un hallazgo nuevo y grave, en `src/modules/agenda/actions.ts`.

### a) Cualquiera puede pedir los turnos de cualquier negocio

```ts
export async function getAppointmentsAction(tenantId?: string, branchId?: string) {
  return withDbFallback(async () => {
    let targetTenantId = tenantId;
    if (!targetTenantId) {
      const defaultTenant = await db.tenant.findFirst({ select: { id: true } });
      ...
```

Esta función **no verifica sesión en absoluto**. Recibe el `tenantId` como parámetro común y corriente:
- Si se lo pasás, te devuelve los turnos de *ese* negocio, sea tuyo o no.
- Si no se lo pasás, agarra **el primer tenant que encuentre en toda la base**, al azar.

Esto es exactamente la regla de oro de multi-tenancy que definimos rompiéndose: el `tenantId` tiene que salir siempre de la sesión verificada (`resolveTenantContext`), nunca de un parámetro.

### b) Datos de mentira mezclados con datos reales, para todos los negocios

```ts
const fallbackAppointmentsStore: any[] = [
  { id: "apt-demo-1", customerName: "Carlos Gómez", ... },
  { id: "apt-demo-2", customerName: "Ana Martínez", ... },
];
...
const combined = [...fallbackAppointmentsStore];
for (const item of dbMapped) { ... combined.push(item) ... }
return combined;
```

**Todos los negocios, siempre, ven estos dos turnos falsos mezclados con sus turnos reales.** No es un fallback que se active solo si la base falla: se antepone siempre, pase lo que pase.

### c) Las reservas públicas de un negocio pueden aparecer en el panel de otro

```ts
export async function createPublicBookingAction(...) {
  ...
  fallbackAppointmentsStore.unshift(newFallbackApt); // se ejecuta SIEMPRE, antes de intentar guardar en la base real
  try {
    const result = await createPublicBookingService(...);
    ...
```

`fallbackAppointmentsStore` es un array en memoria, **compartido por toda la instancia del servidor**, no por tenant. Como `getAppointmentsAction` mezcla este array en la respuesta de cualquiera que la llame, **una reserva hecha en la página pública de un negocio puede terminar mostrándose en el panel de otro negocio distinto**, con nombre y teléfono real del cliente incluidos.

### d) Lo mismo pasa con los datos públicos de reserva

`getPublicBranchDataAction`, en el mismo archivo, tiene un `fallbackDemoData` completo con un negocio ficticio ("Gráfica & Imprenta PubliDesign") que se le muestra a un cliente real si el negocio todavía no cargó servicios o personal — mostrando precios y servicios de otro rubro, inventados.

**Corrección, en orden:**
1. Sacar por completo el patrón `withDbFallback` + arrays en memoria de estas dos funciones. Si la base falla, la función tiene que devolver un error claro, nunca datos inventados ni de otro tenant.
2. `getAppointmentsAction` debe recibir el tenant desde `resolveTenantContext` (sesión), no como parámetro.
3. `updateAppointmentStatusAction` (mismo archivo) tampoco valida tenant ni rol al actualizar por `appointmentId` — agregar el filtro `where: { id: appointmentId, tenantId }` y no solo `{ id: appointmentId }`.
4. Está bien tener una demo pública de ejemplo para mostrar el producto, pero tiene que vivir en una ruta separada y explícita (ej. `/b/demo`), nunca mezclada como "resultado de respaldo" de un negocio real.

---

## 🟠 Alto: el registro de un negocio nuevo nunca crea su suscripción

`src/modules/auth/infrastructure/prisma-onboarding-repository.ts` — `createTenantWithMasterData` crea el Tenant, la Sucursal, el Usuario y un Servicio, pero **nunca crea un registro en la tabla `Subscription`**, a pesar de que el modelo existe en el schema con estado `TRIALING` por defecto. Esto también se había pedido corregir antes.

Como consecuencia, toda la lógica de "días de prueba" que ves en el panel (`subscription/page.tsx`, el banner de "Día 33 de 37" en el layout) **no tiene ninguna fuente de verdad real** — es pura simulación en el navegador (`useState<number>(33)`), lo que probablemente explica la sensación de "esto ya debería haberse borrado": no es una cuenta vieja, es un número inventado que nunca se conecta a nada.

**Corrección:** al crear el tenant, crear también su `Subscription` con `status: "TRIALING"` y `trialEndsAt` a 14 días desde el registro. El panel debe leer ese valor real, no un `useState` local.

---

## 🟡 Medio: falta el ícono / favicon

Seguimos sin `src/app/icon.svg` (o `favicon.ico`). Esto también se había pedido y no se hizo. Ya tenés `public/vaIcon.svg` listo para usar como base.

**Corrección:** copiar `public/vaIcon.svg` a `src/app/icon.svg` y agregar `metadata.icons` en `src/app/layout.tsx`.

---

## 🟡 Medio: otros puntos a revisar

- **`db.ts`**, `withDbFallback`: además de los usos ya señalados en agenda, revisar que no se use en ningún otro lugar donde ocultar un error de base de datos sea peligroso (por ejemplo, cualquier escritura de dinero o stock).
- **Body del webhook de Mercado Pago**: al usar `await req.text()` y validar recién después con Zod, un payload gigante o malformado consume recursos antes de rechazarse. Agregar un límite de tamaño de body.
- **Roles**: no encontré, en ninguna Action de escritura (clientes, stock, usuarios, sucursales), una verificación de que el rol de la sesión (`OWNER`/`ADMIN`/`STAFF`) tenga permiso para esa acción puntual. Una vez conectado el frontend real (hallazgo #1), hay que agregar esa verificación por acción, no solo por página.
- **`.env` en Vercel**: confirmar que las variables `Development` (hoy vacías del todo, según lo que viste en el dashboard) se completen antes de usar `vercel dev` o previews de rama, o vas a repetir el mismo error de "disconnected" en esos entornos.

---

## Orden sugerido de trabajo

1. Sacar los dos secretos hardcodeados (`JWT_SECRET`, `FISCAL_ENCRYPTION_KEY`) — 10 minutos, cero excusas para no hacerlo ya.
2. Arreglar el webhook de Mercado Pago (firma obligatoria + no confiar en `tenantId`/`plan` del body).
3. Agregar `middleware.ts` para exigir sesión en todo el panel, y sacar los datos de usuario hardcodeados del layout.
4. Arreglar `agenda/actions.ts`: sacar el fallback con datos falsos y el `tenantId` como parámetro público.
5. Conectar de verdad las 8 pantallas del panel a sus Actions reales (empezar por Clientes y Stock, que son las que más usás vos).
6. Crear la `Subscription` al registrar, y conectar el botón de Mercado Pago al checkout real.
7. Favicon.

## Prompt para pasarle a Antigravity

```
Tenés un archivo AUDITORIA.md en la raíz del proyecto con hallazgos concretos,
con archivo y línea de cada problema. Trabajalos en el orden de la sección
"Orden sugerido de trabajo", uno por vez.

Reglas:
- No marques nada como resuelto sin mostrarme evidencia (un test que lo
  cubra, o la salida real de probarlo).
- Antes de dar por hecho un punto, releé el hallazgo completo en el .md:
  varios de estos ya se habían pedido en una vuelta anterior y quedaron
  sin hacer, así que confirmame explícitamente qué cambiaste y por qué
  ahora sí queda resuelto.
- Para el punto 5 (conectar las 8 pantallas), el backend de cada módulo
  ya existe en src/modules/<modulo>/actions.ts — el trabajo es de
  integración de UI, no reescribir la lógica de negocio.
- Después de cada punto, corré npm run build y npm run test y pegame
  la salida completa antes de pasar al siguiente.
```
