# SICAE — Contrato de rutas API (v1)

> Documento de referencia **obligatorio**: backend y frontend deben implementar exactamente estas rutas.
> Prefijo global: `/api/v1` (definido en `apps/api/src/main.ts` con `app.setGlobalPrefix('api/v1')`).
> Los `@Controller()` de cada módulo usan la ruta relativa indicada aquí (sin el prefijo).

## Convenciones generales

- **Auth**: `Authorization: Bearer <accessToken>` en todos los endpoints, salvo los marcados `PUBLICO`.
- **Listados**: responden `Page<T>` → `{ items: T[], total, page, pageSize, totalPages }`.
- **Errores**: `{ statusCode: number, message: string | string[], error?: string }` (filtro global).
- **Fechas**: ISO-8601 (UTC). **Montos/horas**: `HH:mm` (`class-local` de Prisma `TIME`).
- **Decoradores**: `@Roles('ADMIN', ...)` requiere `roles`; `@Public()` marca endpoints públicos.

## 1. Identity (`identity/presentation`)

| Método | Ruta relativa | Body / Query | Respuesta | Notas |
|---|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ accessToken, user }` | `@Public()` |
| POST | `/auth/forgot-password` | `{ email }` | `{ ok: true }` | `@Public()`, envía mail con token |
| POST | `/auth/reset-password` | `{ token, newPassword }` | `{ ok: true }` | `@Public()` |
| GET | `/auth/me` | — | `UserResponse` | perfil del token |
| GET | `/users` | `page,pageSize,q?,active?` | `Page<UserResponse>` | `ADMIN` |
| POST | `/users` | `{ email, firstName, lastName, password, roleNames[] }` | `UserResponse` | `ADMIN` |
| POST | `/users/:id/roles` | `{ roleNames[] }` | `UserResponse` | `ADMIN` (assign-role) |
| GET | `/roles` | — | `RoleResponse[]` | `ADMIN` |

`UserResponse = { id, email, firstName, lastName, active, roles: string[], createdAt }`

## 2. Academic (`academic/presentation`)

| Método | Ruta | Body/Query | Respuesta |
|---|---|---|---|
| GET/POST | `/careers` | `{ code, name, degree? }` | `Page<Career>` / `Career` |
| GET/POST | `/terms` | `{ careerId, name, startDate, endDate }` | `Page<Term>` / `Term` |
| GET/POST | `/courses` | `{ careerId, code, name, credits, semester }` | `Page<Course>` / `Course` |
| GET/POST | `/sections` | `{ courseId, termId, name, teacherId?, capacity }` | `Page<Section>` / `Section` |
| GET/POST | `/sections/:id/schedules` | `{ dayOfWeek(0-6), startTime, endTime, room? }` | `Schedule[]` / `Schedule` |
| GET | `/sessions` | `page,pageSize,sectionId?,date?,status?` | `Page<ClassSession>` |
| POST | `/sessions` | `{ sectionId, date, topic? }` | `ClassSession` |
| POST | `/sessions/:id/start` | — | `ClassSession` (`IN_PROGRESS`) |
| POST | `/sessions/:id/close` | — | `ClassSession` (`CLOSED`) — dispara cierre de asistencia |

`ClassSession = { id, sectionId, date, topic, status, startedAt, closedAt, section: {id,name,course:{name}} }`

## 3. Enrollment (`enrollment/presentation`)

| Método | Ruta | Body/Query | Respuesta |
|---|---|---|---|
| GET/POST | `/students` | `{ code, firstName, lastName, email, careerId? }` | `Page<Student>` / `Student` |
| GET | `/enrollments` | `page,pageSize,sectionId?,studentId?,status?` | `Page<Enrollment>` |
| POST | `/enrollments` | `{ studentId, sectionId }` | `Enrollment` |

## 4. Attendance (`attendance/presentation`)

| Método | Ruta | Body/Query | Respuesta |
|---|---|---|---|
| GET | `/attendance` | `page,pageSize,sessionId?,studentId?,status?` | `Page<AttendanceRecord>` |
| POST | `/attendance` | `{ sessionId, studentId, status, source?, notes? }` | `AttendanceRecord` (marca individual) |
| POST | `/attendance/bulk` | `{ sessionId, marks: [{ studentId, status }] }` | `{ created, updated }` |
| PATCH | `/attendance/:id` | `{ status, reason }` | `AttendanceRecord` — **corrección**, deja `auditLog` |
| GET | `/attendance/summary` | `studentId, termId?` | `{ total, present, absent, justified, late, absenceRate }` |

`AttendanceRecord = { id, sessionId, studentId, status, source, notes, markedAt, markedById, correctedAt? }`

## 5. Justification (`justification/presentation`)

| Método | Ruta | Body/Query | Respuesta |
|---|---|---|---|
| GET | `/justifications` | `page,pageSize,status?,studentId?` | `Page<JustificationResponse>` |
| POST | `/justifications` | **multipart**: `attendanceRecordId, reason, attachments[]` | `JustificationResponse` |
| GET | `/justifications/:id` | — | `JustificationResponse` |
| PATCH | `/justifications/:id/review` | `{ decision: 'APPROVED'\|'REJECTED', comment? }` | `JustificationResponse` — aprueba ⇒ marca `AttendanceRecord.status=JUSTIFIED` |

`JustificationResponse = { id, attendanceRecordId, studentId, reason, status, submittedAt, reviewedById?, reviewedAt?, attachments: [{id,fileName,url}] }`

## 6. Followup (`followup/presentation`)

| Método | Ruta | Body/Query | Respuesta |
|---|---|---|---|
| GET/POST | `/policies` | `{ name, maxAbsences, absencePercentageThreshold, toleranceMinutes, careerId?, active }` | `Page<Policy>` / `Policy` |
| GET | `/risk-assessments` | `page,pageSize,level?,studentId?` | `Page<RiskAssessment>` |
| POST | `/risk-assessments/run` | `{ studentIds? }` | `{ evaluated, alertsCreated }` (ejecuta evaluación) |
| GET | `/alerts` | `page,pageSize,status?,severity?` | `Page<Alert>` |
| PATCH | `/alerts/:id/ack` | — | `Alert` (`ACKNOWLEDGED`) |
| PATCH | `/alerts/:id/resolve` | — | `Alert` (`RESOLVED`) |

## 7. Reporting (`reporting/presentation`)

| Método | Ruta | Query | Respuesta |
|---|---|---|---|
| GET | `/reports/attendance-by-section` | `sectionId, from, to` | `{ section, rows: [{ date, present, absent, justified }] }` |
| GET | `/reports/student-risk` | `careerId?` | `{ rows: [{ student, absenceRate, riskScore, level }] }` |
| GET | `/reports/teacher-load` | `termId` | `{ rows: [{ teacher, sections, students }] }` |
| GET | `/reports/export/attendance` | `sectionId, from, to, format=xlsx\|pdf` | archivo descargable (`Content-Disposition`) |

## 8. Audit (`audit/presentation`)

| Método | Ruta | Query | Respuesta |
|---|---|---|---|
| GET | `/audit` | `page,pageSize,entityType?,userId?` | `Page<AuditLog>` — `ADMIN` |

`AuditLog = { id, userId?, action, entityType, entityId?, before?, after?, ipAddress?, userAgent?, createdAt }`