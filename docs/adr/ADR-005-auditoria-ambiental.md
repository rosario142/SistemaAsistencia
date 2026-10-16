# ADR-005: Auditoría de negocio mediante interceptor global en mutaciones

- **Estado**: Aceptado
- **Fecha**: 2026-10-15
- **Decisores**: Equipo SICAE

## Contexto

SICAE debe registrar en `AuditLog` toda acción sensible —en especial las
**correcciones de asistencia** (`PATCH /attendance/:id`), las decisiones sobre
justificaciones y la gestión de usuarios/roles— respondiendo: quién, cuándo,
qué entidad, qué valor tenía antes y después, IP y user-agent. La auditoría
debe ser difícil de olvidar (no puede depender de que cada controlador acuerde
escribir el registro) y no debe contaminar la lógica de negocio.

Se barajan tres enfoques: auditoría declarada en cada endpoint, auditoría a
nivel de base de datos (triggers), o un mecanismo transversal del framework.

## Decisión

Implementamos una **auditoría transversal en la API** compuesta por:

- Un **interceptor global** (`AuditInterceptor`, registrado en `main.ts`) que,
  en mutaciones (`POST`, `PATCH`, `PUT`, `DELETE`) de endpoints anotados con
  `@Auditable(' entityType', 'accion')`, captura:
  `userId` (del request autenticado), `action`, `entityType`, `entityId`,
  `before`/`after` (DTO de entrada o snapshots provistos por el caso de uso),
  `ipAddress` y `userAgent`.
- Un **servicio `AuditService`** con un único método `log(...)` que inserta el
  registro; la escritura es **append-only**: `AuditLog` no expone endpoints de
  modificación ni borrado, y los módulos de negocio no pueden alterarlo.
- Los casos de uso que necesitan el snapshot «antes» (p. ej. corrección de
  asistencia) lo obtienen del repositorio y lo exponen en el contexto del
  interceptor (`AuditContext`), evitando que el interceptor haga queries
  propias.
- Consulta limitada a `ADMIN` vía `GET /audit` con filtros y paginación.

Los triggers de BD se descartan como mecanismo primario porque no tienen
acceso al usuario autenticado (sin JWT dentro de PostgreSQL) y su lógica es
menos testeable en el stack de Jest del proyecto; se conservan solo como red
de seguridad opcional si se detectan escrituras externas al API.

## Consecuencias

**Positivas**
- Una sola pieza central garantiza la trazabilidad: añadir auditoría a un
  endpoint nuevo es una anotación, no código repetido.
- El `AuditLog` queda aislado de los errores de negocio (si falla, se degrada
  con log de error sin romper la operación principal).
- El interceptor es agnóstico del módulo: sirve a attendance, justification,
  identity y followup por igual.

**Negativas / rieskos**
- Riesgo de que un endpoint mutable nuevo se olvide de `@Auditable`; se mitiga
  con una regla en revisión de PR y con tests de integración por flujo
  crítico (corrección de asistencia, revisión de justificación).
- `before`/`after` guardan JSON de entrada; si un DTO evoluciona, los registros
  antiguos conservan su snapshot histórico (aceptado: es un log).
- El interceptor añade una escritura por mutación; el impacto es despreciable
  respecto a la latencia total.

## Alternativas consideradas

- **Auditoría manual en cada caso de uso o controlador**: máxima flexibilidad,
  pero propensa a olvidos y con lógica duplicada en 8 módulos. Descartada como
  mecanismo único.
- **Triggers de PostgreSQL**: cubren escrituras externas al API, pero no conocen
  al usuario JWT, son difíciles de probar y generan lógica en dos lenguajes.
  Descartados como primarios.
- **Product Change Data Capture (Debezium/Kafka)**: completo y desacoplado, pero
  desproporcionado (dos servicios nuevos) para el tamaño del sistema.
  Descartado.
