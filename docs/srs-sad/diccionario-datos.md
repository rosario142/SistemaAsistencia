# SICAE — Diccionario de datos

Glosario de entidades persistentes (modelo Prisma, `apps/api/prisma/schema.prisma`)
y de sus estados/enums. Es el complemento de `SRS.md` y `SAD.md`; el contrato de
los endpoints está en `docs/api-routes.md`.

Convenciones: todas las entidades tienen `id` (UUID), `createdAt` y
`updatedAt` salvo `AuditLog` (solo inserción). Nombres técnicos en inglés,
documentación en español.

## 1. Entidades principales

| Término (entidad) | Definición | Estados / enums | Módulo dueño |
|---|---|---|---|
| `User` | Cuenta de acceso con email, nombre y hash argon2 de contraseña. Puede estar desactivado (`active=false`). | — (`active: boolean`) | identity |
| `Role` | Rol autorizativo asignable a usuarios. | `ADMIN`, `COORDINADOR_ACADEMICO`, `DOCENTE`, `ESTUDIANTE` | identity |
| `Permission` | Permiso fino asociado a un rol (reserva para RBAC granular). | — | identity |
| `Career` | Carrera o programa académico ofertado por la institución. | — | academic |
| `Term` | Periodo académico de una carrera con fechas de inicio y fin. | — | academic |
| `Course` | Asignatura de una carrera (código, créditos, semestre). | — | academic |
| `Section` | Agrupación de estudiantes de un curso en un término, con docente responsable y capacidad. | — | academic |
| `Schedule` | Franja horaria recurrente de una sección (día 0-6, inicio, fin, aula). | — | academic |
| `ClassSession` | Ourrencia datada de una sección en la que se marca asistencia. | `SCHEDULED` → `IN_PROGRESS` → `CLOSED` | academic |
| `Student` | Ficha académica del estudiante (código, nombres, email, carrera). | — | enrollment |
| `Enrollment` | Vínculo matriculado entre un `Student` y una `Section` en un término. | `ACTIVE`, `DROPPED` | enrollment |
| `AttendanceRecord` | Marcado de un estudiante en una sesión. Único por `(session, student)`. | `PRESENT`, `ABSENT`, `LATE`, `JUSTIFIED` | attendance |
| `JustificationRequest` | Solicitud del estudiante para justificar una ausencia, con motivo y adjuntos. | `PENDING`, `APPROVED`, `REJECTED` | justification |
| `Attachment` | Archivo adjunto de una justificación (PDF/JPG/PNG) almacenado en `UPLOAD_DIR`. | — | justification |
| `AttendancePolicy` | Regla de riesgo por ámbito (global o carrera): máximo de ausencias y/o % de umbral, con vigencia. (`Policy` en la API) | `active: boolean` | followup |
| `RiskAssessment` | Resultado de evaluar a un estudiante contra las políticas activas (tasa, score y nivel). | `LOW`, `MEDIUM`, `HIGH` | followup |
| `Alert` | Alerta de seguimiento generada al superar una política. | `OPEN` → `ACKNOWLEDGED` → `RESOLVED` | followup |
| `AuditLog` | Registro inmutable de una mutación sensible: quién, qué, antes/después, IP y user-agent. | `action`: `CREATE`, `UPDATE`, `DELETE` | audit |

## 2. Enums de estados (detalle)

### 2.1 `AttendanceStatus` — estado de un `AttendanceRecord`

| Valor | Definición | Quién lo asigna |
|---|---|---|
| `PRESENT` | El asistió a la sesión. | Docente (marcado) |
| `ABSENT` | No asistió sin justificar. | Docente (marcado) o sistema (cierre de sesión) |
| `LATE` | Llegó después del inicio; cuenta como asistencia con nota. | Docente (marcado) |
| `JUSTIFIED` | Ausencia aprobada mediante `JustificationRequest`. | Sistema (al aprobar la justificación) |

Transiciones válidas: `ABSENT`/`LATE`/`PRESENT` ⇄ corrección del docente con
motivo (auditoría); `ABSENT` → `JUSTIFIED` solo vía aprobación de justificación.

### 2.2 `ClassSessionStatus` — estado de una `ClassSession`

| Valor | Definición |
|---|---|
| `SCHEDULED` | Creada pero aún no iniciada; no admite marcado. |
| `IN_PROGRESS` | En curso; el docente marca o corrige asistencia. |
| `CLOSED` | Finalizada; los no marcados quedan `ABSENT` y no admite marcado nuevo. |

### 2.3 `JustificationStatus` — estado de una `JustificationRequest`

| Valor | Definición |
|---|---|
| `PENDING` | Enviada por el estudiante, a la espera de revisión. |
| `APPROVED` | Aprobada por coordinación → `AttendanceRecord.status = JUSTIFIED` + `AuditLog`. |
| `REJECTED` | Rechazada con comentario opcional; el registro permanece `ABSENT`. |

### 2.4 `RiskLevel` y `AlertStatus` — followup

| Enum | Valores | Notas |
|---|---|---|
| `RiskLevel` | `LOW`, `MEDIUM`, `HIGH` | Nivel calculado en el `RiskAssessment`; umbral definido por política. |
| `AlertStatus` | `OPEN`, `ACKNOWLEDGED`, `RESOLVED` | Ciclo de vida de la alerta; una alerta `OPEN` no se duplica para la misma política+estudiante+periodo. |

### 2.5 `AttendanceSource` — origen del marcado

| Valor | Definición |
|---|---|
| `MANUAL` | Marcado puntual del docente (`POST /attendance`). |
| `BULK` | Marcado masivo (`POST /attendance/bulk`). |
| `SYSTEM` | Asignación automática al cerrar la sesión (ausentes no marcados). |

## 3. Glosario de términos de negocio

| Término | Definición |
|---|---|
| Tasa de ausentismo | Porcentaje de registros `ABSENT` sobre el total de la instancia evaluada (`/attendance/summary`). |
| Score de riesgo | Valor derivado de la tasa y el máximo de ausencias según la política; base del `RiskLevel`. |
| Corrección | Cambio de estado de un `AttendanceRecord` por el docente con motivo obligatorio; siempre genera `AuditLog`. |
| Instancia evaluada | Conjunto de registros de asistencia (por término o sección) considerado en un `RiskAssessment`. |
