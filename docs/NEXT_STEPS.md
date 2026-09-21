# VASaaS: Plan para llevar el MVP a producción

> Documento de trabajo para usar con Claude Code y/o Antigravity.
> Base: `ESTADO_MVP.md`. Guardá este archivo en `docs/NEXT_STEPS.md` y pedile al agente que lo lea antes de cada fase.

---

## 0. Cómo usar este documento

1. Trabajá **una fase por vez**. No pases a la siguiente sin cumplir el "Definition of Done" (DoD).
2. Al empezar cada fase: `/clear` (Claude Code) o conversación nueva (Antigravity), y pedile que lea `AGENTS.md`, `docs/SPEC.md` y este archivo.
3. Al terminar cada fase: **commit + tag** (`git tag fase-7-ok`). Si algo se rompe, volvés atrás.
4. Regla de oro: **"COMPLETADO" solo cuenta si lo podés demostrar** corriendo algo (test, pantalla o comando), no porque el reporte lo diga.

---

## 1. Diagnóstico: qué está dicho vs qué hay que verificar

El estado del MVP marca todo como completado. Antes de construir encima, hay que separar lo que está **demostrado** de lo que está **declarado o simulado**.

| Área | Lo que dice el reporte | Qué hay que verificar / riesgo |
|---|---|---|
| Base de datos | Docker listo, pero los pasos de activación figuran como *pendientes* | ¿Alguna vez corrió contra PostgreSQL real? Los 35 tests pueden estar usando mocks o memoria. |
| Multi-tenancy | "Aislamiento estricto" | Falta evidencia de tests contra base real: crear datos en tenant A y comprobar que B no los ve (lectura, escritura, borrado, y también en el link público). |
| Agenda | Validación de solapamiento | Casos borde: turnos contiguos, cambio de horario de verano/zona horaria, dos reservas simultáneas al mismo horario (condición de carrera). |
| Reserva pública | Portal `/b/[tenantSlug]/[branchSlug]` | Endpoint sin login = superficie de abuso: spam de reservas, enumeración de tenants, datos personales del cliente. |
| Facturación | CAE **simulado** | No es facturación real. Además el reporte menciona Facturas A, B y presupuestos, pero **no Factura C** (la que emite un monotributista, muy común en pequeños negocios). |
| Stock | Descuento por receta al facturar | Si dos cobros ocurren a la vez, ¿el stock puede quedar negativo o inconsistente? ¿El stock se calcula desde movimientos? |
| Suscripciones | Planes y límites | Hay control de límites, pero **no hay cobro real** ni webhooks, ni período de prueba, ni bloqueo por falta de pago. |
| Actualización | Auto-refresh cada 5 s | Es polling: con muchos tenants genera carga innecesaria. Aceptable para MVP, mejorable después. |
| Front | Glassmorphism, agenda | Falta confirmar: login, registro de negocio, gestión de usuarios, pantallas de stock y facturación, y que se vea bien en celular. |

---

## 2. Hoja de ruta

| Fase | Nombre | Objetivo | Prioridad |
|---|---|---|---|
| 7 | Verificación y entorno real | Que todo corra de verdad contra PostgreSQL y que el aislamiento esté probado | Crítica |
| 8 | Auth y experiencia completa | Registro, login, roles, onboarding y pantallas faltantes | Alta |
| 9 | Robustez de datos | Concurrencia, transacciones, zonas horarias, integridad | Alta |
| 10 | Seguridad | Auditoría, rate limiting, protección del portal público | Alta |
| 11 | Facturación fiscal real (ARCA) | Homologación y luego producción | Alta (la más delicada) |
| 12 | Cobros con Mercado Pago | Suscripciones del SaaS y señas de turnos | Media-alta |
| 13 | Producción | Deploy, backups, monitoreo, legales | Crítica antes de vender |
| 14 | Post-MVP | Recordatorios, reportes, mejoras | Después de tener clientes |

---

## 3. Fase 7: Verificación y entorno real

**Objetivo:** confirmar que lo que se reportó como hecho funciona contra una base de datos real.

### Prompt 7.1: auditoría contra la realidad

```
Entrá en modo plan y NO escribas código todavía.
Leé AGENTS.md, docs/SPEC.md, docs/DATA_MODEL.md y docs/NEXT_STEPS.md.

Hacé una auditoría honesta del repo y devolveme una tabla con:
1) Cada módulo (agenda, facturación, stock, multi-tenancy, suscripciones).
2) Estado real: funciona con DB real / funciona solo con mocks / simulado / sin hacer.
3) Evidencia: qué test o archivo lo demuestra.
4) Los 35 tests: cuáles usan PostgreSQL real y cuáles usan mocks o memoria.
5) Cosas que el reporte declara completas pero no tienen prueba.

No me digas lo que quiero escuchar: marcá con claridad lo que no está probado.
```

### Prompt 7.2: levantar el entorno

```
Ayudame a levantar el entorno local completo con Docker Compose, paso a paso.
Después:
1) Corré las migraciones (preferí `prisma migrate` por sobre `db push` y
   explicame la diferencia y por qué conviene para producción).
2) Corré el seed.
3) Verificá que la app conecta y que las pantallas principales cargan.
4) Dejá un README con los comandos exactos para un desarrollador nuevo
   (clonar, .env.example, levantar, migrar, seed, tests).
Mostrame la salida real de cada comando.
```

### Prompt 7.3: tests de aislamiento con base real

```
Creá una suite de tests de integración que corra contra PostgreSQL real
(base de tests separada, que se limpie entre corridas).

Escenario: crear el tenant A y el tenant B, cada uno con sucursales,
usuarios, clientes, servicios, turnos, productos y comprobantes.
Probar que con el contexto del tenant A NO se puede:
- leer, listar, editar ni borrar datos del tenant B (probar cada módulo)
- acceder por ID directo a un recurso de B (IDOR)
- reservar ni ver datos privados de B desde el portal público de A
Verificá también que ninguna query de Prisma omita el filtro por tenantId.
Si encontrás fugas, listalas ANTES de arreglarlas y esperá mi OK.
```

**DoD Fase 7**
- [ ] `docker compose up` levanta todo desde cero en una máquina limpia.
- [ ] Migraciones y seed funcionan.
- [ ] Los tests de aislamiento corren contra PostgreSQL real y pasan.
- [ ] Hay una tabla honesta de qué está real y qué simulado.
- [ ] `test`, `lint` y `typecheck` en verde.

---

## 4. Fase 8: Auth y experiencia completa

**Objetivo:** que un dueño de negocio pueda registrarse y usar el sistema sin ayuda.

### Prompt 8.1: flujo de alta

```
Implementá el flujo completo de alta de un negocio (onboarding):
1) Registro del owner (email + contraseña con hash seguro, o el proveedor
   de auth que definamos), verificación de email y recuperación de contraseña.
2) Creación del tenant, primera sucursal, horarios de atención y primer servicio.
3) Invitación de usuarios (admin/staff) por email o link con expiración.
4) Sesiones seguras (cookies httpOnly, expiración y renovación).
Cada permiso debe verificarse en el servidor, no solo ocultarse en la UI.
Escribí tests que prueben que un STAFF no puede hacer acciones de ADMIN
ni de OWNER.
```

### Prompt 8.2: pantallas faltantes

```
Revisá qué pantallas faltan comparando con SPEC.md y listalas.
Después implementá (una por vez, mostrándome cada una):
- Gestión de clientes (alta, búsqueda, historial de turnos)
- Gestión de servicios y profesionales
- Pantalla de stock (productos, insumos, movimientos, alertas)
- Pantalla de facturación (listado, detalle, PDF)
- Configuración del negocio y de la sucursal
Requisitos: diseño responsive (probá en ancho de celular), estados de
carga, estados vacíos con mensajes útiles, y errores claros en español.
```

**DoD Fase 8**
- [ ] Una persona nueva completa el registro y carga su primer turno sin ayuda.
- [ ] Todas las pantallas funcionan en celular.
- [ ] Tests de permisos por rol en verde.

---

## 5. Fase 9: Robustez de datos

**Objetivo:** que el sistema aguante uso real, con varias personas operando a la vez.

### Prompt 9.1: concurrencia

```
Analizá y corregí las condiciones de carrera:
1) Dos personas reservando el mismo horario a la vez: debe ganar una sola
   (usá una restricción a nivel de base de datos o una transacción con
   bloqueo, no solo validación en código).
2) Dos cobros simultáneos que descuentan el mismo insumo: el stock no puede
   quedar inconsistente.
3) Numeración de comprobantes: correlativa, sin saltos ni duplicados por
   punto de venta, incluso con emisiones simultáneas.
Escribí tests que fuercen estas carreras (ej: 20 requests en paralelo)
y demostrame que pasan.
```

### Prompt 9.2: fechas y zonas horarias

```
Auditá el manejo de fechas. Reglas:
- Guardar en UTC, mostrar en America/Argentina/Buenos_Aires.
- Los horarios de atención se interpretan en la zona horaria de la sucursal.
- Tests de bordes: turno a medianoche, cambio de día, turnos contiguos
  (el que termina 10:00 no solapa con el que empieza 10:00).
```

### Prompt 9.3: integridad y auditoría

```
Agregá:
- Soft delete donde corresponda (clientes, servicios). Los comprobantes
  emitidos NUNCA se borran ni se editan; se anulan con nota de crédito.
- Registro de auditoría (quién hizo qué y cuándo) para facturas, stock
  y cambios de permisos.
- Índices en las columnas que se filtran seguido (tenantId + fecha, etc.).
```

**DoD Fase 9**
- [ ] Tests de concurrencia pasan de forma repetible (correrlos 10 veces).
- [ ] Ningún cálculo depende de la zona horaria del servidor.
- [ ] Existe historial de auditoría de operaciones sensibles.

---

## 6. Fase 10: Seguridad

### Prompt 10.1: auditoría de seguridad

```
Actuá como auditor de seguridad. NO modifiques código todavía.
Revisá el repo buscando:
- Fugas entre tenants y IDOR
- Server Actions y rutas API sin verificación de sesión o de rol
- Validaciones Zod faltantes en entradas del usuario
- Secretos en el código o en el historial de git
- Inyección, XSS, y falta de protección CSRF
- Dependencias con vulnerabilidades conocidas (`npm audit`)
- Datos sensibles en logs
Devolvé hallazgos por severidad (crítica/alta/media/baja) con archivo y
línea, y una propuesta de arreglo para cada uno. Esperá mi aprobación.
```

### Prompt 10.2: protección del portal público

```
El portal público de reservas es la superficie más expuesta. Implementá:
- Rate limiting por IP y por tenant
- Protección anti-bots (captcha o similar, evaluá opciones y proponeme una)
- Límite de reservas activas por cliente/teléfono
- Confirmación o verificación del contacto antes de confirmar el turno
- Que las respuestas no expongan datos de otros clientes ni información
  interna del negocio
- Que los slugs no permitan enumerar negocios
```

### Prompt 10.3: revisión cruzada (para tu comparación de herramientas)

```
Ejecutá este prompt en LA OTRA herramienta (si construyó Claude Code,
auditá con Antigravity y viceversa):
"Auditá esta rama como si fueras un atacante. Intentá encontrar cómo leer
datos de otro tenant, saltear permisos o romper la numeración de facturas.
Listá hallazgos reproducibles."
```

**DoD Fase 10**
- [ ] Cero hallazgos críticos o altos abiertos.
- [ ] Rate limiting activo y probado.
- [ ] `npm audit` sin vulnerabilidades altas/críticas sin resolver.

---

## 7. Fase 11: Facturación fiscal real (ARCA)

> **Importante:** esta fase requiere validación con un **contador**. La facturación electrónica tiene reglas fiscales que el código solo no resuelve. Verificá en la documentación oficial vigente, porque los requisitos y nombres de los servicios pueden cambiar. Nota: la AFIP fue reemplazada por **ARCA** en 2024; los web services (WSAA/WSFE) se siguen usando, pero confirmá los detalles actuales.

### Decisiones previas (definilas vos, con el contador)

| Decisión | Opciones |
|---|---|
| ¿Quién factura? | El negocio cliente con **su propio CUIT y certificado** (lo normal en un SaaS multi-tenant). No uses tu CUIT para facturar por otros. |
| Condición frente al IVA de tus clientes | Monotributo (Factura C), Responsable Inscripto (A y B), y qué pasa con exentos |
| Integración | Directa con los web services de ARCA, o mediante una librería/servicio intermediario. Evaluá costo, mantenimiento y riesgo |
| Certificados | Cómo cada cliente carga su certificado y clave, y **cómo los guardás cifrados** |

### Prompt 11.1: diseño

```
Entrá en modo plan. Diseñá la integración fiscal SIN escribir código:
1) Interfaz `FiscalProvider` (adapter) con implementaciones: `SimulatedProvider`
   (la actual), `HomologationProvider` y `ProductionProvider`.
2) Soporte de Factura A, B, C, notas de crédito/débito y presupuesto
   (interno, sin validez fiscal).
3) Almacenamiento seguro por tenant de CUIT, punto de venta, condición de IVA,
   certificado y clave privada (cifrado en reposo, nunca en logs).
4) Manejo de errores y reintentos: qué pasa si ARCA no responde, y cómo evitar
   emitir dos veces el mismo comprobante (idempotencia).
5) Reglas de qué tipo de comprobante corresponde según la condición
   emisor/receptor.
Listá preguntas abiertas que debería validar con un contador.
```

### Prompt 11.2: implementación en homologación

```
Implementá HomologationProvider contra el ambiente de homologación de ARCA.
Requisitos:
- Obtención y renovación del token de autenticación (WSAA), con caché.
- Solicitud de CAE (WSFE) con el último número autorizado como fuente de verdad.
- Guardar CAE, vencimiento del CAE, número de comprobante y respuesta cruda.
- Tests con respuestas simuladas de ARCA para casos: éxito, rechazo, timeout.
- Un comando o pantalla de "probar conexión" por tenant.
- Generación de PDF con los datos legales y el QR requeridos (verificá el
  formato vigente en la documentación oficial).
No toques producción.
```

**DoD Fase 11**
- [ ] Emitís comprobantes válidos en homologación.
- [ ] Un contador revisó los tipos de comprobante, IVA y el PDF.
- [ ] Ante un fallo de ARCA, el sistema no duplica ni pierde comprobantes.
- [ ] Certificados guardados cifrados y fuera de los logs.

---

## 8. Fase 12: Cobros con Mercado Pago

Son **dos cosas distintas**. No las mezcles:

1. **Suscripción del negocio a tu SaaS** (vos le cobrás a ellos).
2. **Seña del cliente final al negocio** (el negocio cobra a su cliente).

### Prompt 12.1: suscripciones del SaaS

```
Implementá el cobro de suscripciones con Mercado Pago (verificá en la
documentación oficial vigente el producto de suscripciones/pagos recurrentes).
Incluí:
- Planes STARTER y PRO con precio, y período de prueba configurable.
- Webhooks con verificación de firma y procesamiento idempotente
  (el mismo evento llegando dos veces no debe duplicar nada).
- Estados: prueba, activa, vencida, cancelada.
- Bloqueo suave por falta de pago: el negocio puede ver sus datos y exportarlos,
  pero no crear turnos ni facturas. Nunca borrar datos por impago.
- Pantalla de facturación del tenant: plan actual, próximo cobro, cambiar o
  cancelar plan.
Tests con eventos de webhook simulados, incluyendo firmas inválidas.
```

### Prompt 12.2: señas de turnos (después)

```
Implementá el cobro de seña en el portal público de reservas.
Decisión previa a plantear: cada negocio conecta SU propia cuenta de
Mercado Pago (así el dinero va directo a él). Investigá el modelo de
conexión de cuentas de terceros y proponeme el diseño antes de codear.
Reglas: el turno queda "pendiente de pago" con vencimiento; si no se
acredita, se libera el horario. Definí política de reembolsos.
```

**DoD Fase 12**
- [ ] Cobro de prueba completo de punta a punta en sandbox.
- [ ] Webhooks idempotentes y con firma verificada.
- [ ] El bloqueo por impago no destruye datos.

---

## 9. Fase 13: Producción

### Prompt 13.1: preparación

```
Preparame el despliegue a producción. Entregá:
1) Checklist de variables de entorno (sin valores) y de secretos.
2) Estrategia de base de datos gestionada, backups automáticos, y un
   procedimiento de restauración que probemos al menos una vez.
3) Migraciones seguras en deploy (sin perder datos).
4) Logging estructurado sin datos personales ni secretos, y monitoreo de
   errores.
5) Health checks y alertas básicas.
6) Ambientes separados: desarrollo, staging y producción.
7) Dominio, HTTPS y cabeceras de seguridad.
8) Plan de rollback.
```

### Aspectos legales y de negocio (no los dejes para el final)

- **Términos y condiciones** y **política de privacidad**.
- **Protección de datos personales**: manejás datos de clientes finales de tus clientes. Consultá con un abogado qué obligaciones aplican en Argentina (Ley 25.326 y normativa vigente).
- **Tu propia facturación**: cómo vas a facturar vos las suscripciones (monotributo/sociedad, ARCA).
- **Soporte**: canal de atención (email o WhatsApp) y tiempos de respuesta prometidos.

**DoD Fase 13**
- [ ] Restauración de backup probada.
- [ ] Staging idéntico a producción.
- [ ] Documentos legales publicados.
- [ ] Monitoreo y alertas funcionando.

---

## 10. Fase 14: Post-MVP (con clientes reales)

Ordenado por impacto típico en negocios de turnos. Priorizá según lo que te pidan tus primeros clientes:

1. **Recordatorios automáticos** de turno por WhatsApp o email (reduce ausentismo).
2. **Reportes**: ingresos por período, por profesional, servicios más pedidos, ausencias.
3. **Cierre de caja** diario.
4. **Importación** de clientes y productos desde Excel/CSV.
5. **Lista de espera** cuando no hay horario disponible.
6. **App instalable (PWA)** para el celular del profesional.
7. Reemplazar el polling de 5 s por actualizaciones en tiempo real (SSE/WebSockets).

---

## 11. Reglas permanentes para el agente

Pegá esto en `AGENTS.md` (o `CLAUDE.md`) si todavía no está:

```
- Nunca marques una tarea como completada sin mostrar la salida real de
  test, lint y typecheck.
- Distinguí siempre entre "funciona con base real", "funciona con mocks" y
  "simulado". Si algo es simulado, decilo explícitamente.
- Los comprobantes fiscales emitidos son inmutables: se anulan, no se editan.
- No instales dependencias sin avisar y justificar.
- Ante un error, encontrá la causa raíz antes de tocar código.
- Si una decisión afecta datos, dinero, seguridad o normativa fiscal,
  frená y preguntame.
- Explicá cada decisión importante en 2 líneas.
- Si detectás que un pedido contradice SPEC.md, avisame antes de implementarlo.
```

---

## 12. Protocolo de comparación (Claude Code vs Antigravity)

Si seguís comparando herramientas, las fases de este documento son ideales porque tienen dificultad variada:

| Fase | Qué revela |
|---|---|
| 7.1 (auditoría honesta) | Si la herramienta admite lo que no está probado o infla resultados |
| 9.1 (concurrencia) | Razonamiento técnico profundo y tests que realmente fuerzan carreras |
| 10.1 (seguridad) | Calidad de análisis y hallazgos reales vs genéricos |
| 11.1 (diseño fiscal) | Si pregunta y reconoce límites, o inventa reglas fiscales |
| 12.1 (webhooks) | Idempotencia y manejo de casos borde |

Puntuá 1 a 5 en un `COMPARACION.md`: corrección, seguimiento de reglas, honestidad del reporte, autonomía, verificación y consumo de cuota. Hacé la revisión cruzada (Prompt 10.3) al cierre de cada fase.

---

## 13. Checklist de lanzamiento (primer cliente real)

- [ ] Aislamiento entre tenants probado contra base real
- [ ] Concurrencia de turnos, stock y numeración probada
- [ ] Facturación validada en homologación y revisada por contador
- [ ] Cobro de suscripción funcionando en sandbox y luego con un pago real chico
- [ ] Backups con restauración probada
- [ ] Rate limiting y auditoría de seguridad hechos
- [ ] Términos, privacidad y canal de soporte publicados
- [ ] Onboarding probado con una persona real que no conoce el sistema
- [ ] Piloto con 1 a 3 negocios amigos **antes** de vender abiertamente

> Consejo final: hacé un piloto gratuito con un negocio real usando primero el comprobante interno (presupuesto) mientras terminás la parte fiscal. Vas a aprender más en dos semanas de uso real que en dos meses de desarrollo.
