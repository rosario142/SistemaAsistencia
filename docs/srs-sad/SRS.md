# SICAE — Especificación de Requisitos de Software (SRS)

- **Versión**: 1.0
- **Fecha**: 2026-10-15
- **Formato**: IEEE 830-1998 (adaptado)
- **Estado**: Aprobado para desarrollo

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requisitos de software de **SICAE** (Sistema de
Control de Asistencia Estudiantil), plataforma para la gestión académica de la
asistencia: estructura académica (carreras, términos, cursos, secciones,
horarios), sesiones de clase, marcado de asistencia, justificaciones con
adjuntos, evaluación de riesgo académico con alertas de seguimiento, reportes
exportables y auditoría de acciones sensibles. Destinado a desarrollo, QA y
partes interesadas de la institución.

### 1.2 Alcance

Dentro del alcance: los módulos `identity`, `academic`, `enrollment`,
`attendance`, `justification`, `followup`, `reporting` y `audit` de la API
(`apps/api`), la SPA (`apps/web`) y las piezas de infraestructura asociadas.
Fuera de alcance: matrícula financiera/pagos, gestión de notas, portal de
docentes móvil y videovigilancia.

### 1.3 Definiciones y acrónimos

| Término | Definición |
|---|---|
| Término | Periodo académico (semestre/trimestre) de una carrera |
| Sección | Agrupación de estudiantes matriculados en un curso dentro de un término |
| Sesión de clase | Ourrencia datada de una sección en la que se marca asistencia |
| Marcado | Registro de la asistencia de un estudiante en una sesión |
| Justificación | Solicitud del estudiante para justificar una ausencia, con adjuntos |
| Política de asistencia | Regla de riesgo por sección/carrera (máx. ausencias, % umbral) |
| Alerta | Notificación generada al superar una política de asistencia |

### 1.4 Referencias

- `docs/api-routes.md` — contrato de rutas API v1.
- `docs/srs-sad/SAD.md` — documento de arquitectura y diseño.
- `docs/srs-sad/diccionario-datos.md` — glosario de entidades y estados.
- `docs/adr/ADR-001…005` — decisiones de arquitectura.

### 1.5 Visión general

Los administradores configuran la estructura académica y los usuarios; los
coordinadores gestionan secciones y revisan justificaciones; los docentes
abren sesiones de clase y marcan asistencia; los estudiantes consultan su
asistencia y suben justificaciones. El sistema evalúa el riesgo según
políticas configurables, genera alertas y produce reportes exportables. Toda
corrección queda auditada.

## 2. Descripción general

### 2.1 Perspectiva del producto

SICAE es una aplicación web compuesta por una API REST (`/api/v1`) y una SPA
que la consume. Se despliega con Docker (PostgreSQL 16 + API + nginx) y se
accede mediante navegador de escritorio. Ver `docs/srs-sad/SAD.md` para la
arquitectura.

### 2.2 Funcionalidades principales

| # | Funcionalidad | Módulo |
|---|---|---|
| F1 | Autenticación JWT y gestión de usuarios, roles y permisos | identity |
| F2 | Estructura académica: carreras, términos, cursos, secciones, horarios, sesiones | academic |
| F3 | Fichas de estudiantes y matrícula en secciones | enrollment |
| F4 | Marcado de asistencia individual/masivo, correcciones y resúmenes | attendance |
| F5 | Justificaciones con adjuntos y su revisión por coordinación | justification |
| F6 | Políticas de asistencia, evaluación de riesgo y alertas | followup |
| F7 | Reportes de asistencia, riesgo y carga docente con exportación XLSX/PDF | reporting |
| F8 | Registro inmutable de auditoría de mutaciones sensibles | audit |

### 2.3 Usuarios y roles

| Rol | Descripción | Permisos principales |
|---|---|---|
| `ADMIN` | Administrador del sistema | Usuarios/roles, políticas, auditoría, todas las lecturas |
| `COORDINADOR_ACADEMICO` | Coordinación de carrera | Secciones, revisión de justificaciones, alertas, reportes |
| `DOCENTE` | Docente asignado a secciones | Abrir/iniciar/cerrar sesiones, marcar y corregir asistencia |
| `ESTUDIANTE` | Estudiante matriculado | Ver su asistencia y resumen, crear justificaciones |

### 2.4 Restricciones de usuario

- Interfaz en español; uso en horario lectivo con resoluciones desde 1366×768.
- El docente debe poder marcar una sección completa en menos de 2 minutos.
- El estudiante no puede editar ni eliminar justificaciones ya enviadas.

### 2.5 Supuestos y dependencias

- PostgreSQL 16 disponible y con copias de seguridad periódicas.
- Servidor SMTP institucional para notificaciones y recuperación de contraseña.
- Los usuarios disponen de navegador actualizado (Chrome, Edge, Firefox).

## 3. Requisitos funcionales

Prioridad: **A** (crítica), **B** (alta), **C** (media).

### 3.1 Módulo identity (RF-ID)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-ID-01 | El sistema autentica usuarios con email + contraseña (hash argon2) y emite un JWT con expiración configurable (`JWT_EXPIRES_IN`, 8 h por defecto). | A |
| RF-ID-02 | El sistema expone `GET /auth/me` para obtener el perfil y roles del token. | A |
| RF-ID-03 | El ADMIN puede listar (`Page`, filtros `q`, `active`), crear y desactivar usuarios. | A |
| RF-ID-04 | El ADMIN puede asignar roles a un usuario (`POST /users/:id/roles`) y consultar el catálogo de roles. | A |
| RF-ID-05 | El sistema permite restablecer contraseña por email con token de un solo uso (`forgot-password` / `reset-password`, endpoints públicos). | B |

### 3.2 Módulo academic (RF-AC)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-AC-01 | El ADMIN gestiona carreras (código, nombre, título). | A |
| RF-AC-02 | El ADMIN gestiona términos por carrera con fechas de inicio y fin. | A |
| RF-AC-03 | El ADMIN gestiona cursos por carrera (código, nombre, créditos, semestre). | A |
| RF-AC-04 | El coordinador/ADMIN gestiona secciones por curso y término, con docente responsable y capacidad. | A |
| RF-AC-05 | El sistema administra horarios por sección (día 0-6, hora inicio/fin, aula opcional). | B |
| RF-AC-06 | El DOCENTE crea sesiones de clase para sus secciones (`SCHEDULED`) con fecha y tema opcional. | A |
| RF-AC-07 | El DOCENTE inicia (`IN_PROGRESS`) y cierra (`CLOSED`) una sesión; el cierre dispara el cierre de asistencia (RF-AT-06). | A |

### 3.3 Módulo enrollment (RF-EN)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-EN-01 | El ADMIN/coordinador gestiona fichas de estudiantes (código, nombres, email, carrera). | A |
| RF-EN-02 | El sistema matricula estudiantes en secciones, validando duplicados y capacidad. | A |
| RF-EN-03 | El sistema consulta matrículas paginadas con filtros por sección, estudiante y estado. | A |

### 3.4 Módulo attendance (RF-AT)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-AT-01 | El DOCENTE registra asistencia individual (`PRESENT`, `ABSENT`, `LATE`) en una sesión `IN_PROGRESS` de su sección. | A |
| RF-AT-02 | El DOCENTE registra asistencia masiva (`/attendance/bulk`) para toda la sección en una sola operación, con respuesta `{ created, updated }`. | A |
| RF-AT-03 | El sistema consulta registros paginados con filtros por sesión, estudiante y estado. | A |
| RF-AT-04 | El DOCENTE corrige un registro (`PATCH /attendance/:id`) indicando motivo; el sistema guarda el motivo y genera entrada en `AuditLog` con valores antes/después. | A |
| RF-AT-05 | El sistema calcula el resumen por estudiante (`/attendance/summary`): total, presentes, ausentes, justificados, tardanzas y tasa de ausentismo. | A |
| RF-AT-06 | Al cerrar una sesión, el sistema crea como `ABSENT` los registros de los matriculados sin marcado. | B |

### 3.5 Módulo justification (RF-JU)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-JU-01 | El ESTUDIANTE crea una justificación (multipart) sobre un registro de asistencia propio en estado `ABSENT`, con motivo y adjuntos (PDF/JPG/PNG, máx. 20 MB en total). | A |
| RF-JU-02 | El sistema lista justificaciones paginadas con filtros por estado y estudiante. | A |
| RF-JU-03 | El coordinador/ADMIN revisa justificaciones: `APPROVED` o `REJECTED` con comentario opcional. | A |
| RF-JU-04 | Al aprobar, el sistema cambia el `AttendanceRecord` asociado a `JUSTIFIED` y registra la decisión en `AuditLog`; al rechazar, el registro permanece `ABSENT`. | A |
| RF-JU-05 | El sistema notifica por email al estudiante al resolver su justificación. | C |
| RF-JU-06 | Cada justificación conserva sus adjuntos y su descarga exige autorización (dueño, coordinador o admin). | B |

### 3.6 Módulo followup (RF-FU)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-FU-01 | El ADMIN/coordinador configura políticas de asistencia: máximo de ausencias y/o umbral de porcentaje, con vigencia y ámbito (carrera o global). | A |
| RF-FU-02 | El sistema evalúa a cada estudiante matriculado contra las políticas activas y persiste un `RiskAssessment` con nivel (`LOW`, `MEDIUM`, `HIGH`) y detalle. | A |
| RF-FU-03 | La evaluación genera `Alert` para estudiantes que superan una política, evitando duplicados por estudiante+política+periodo abiertos. | A |
| RF-FU-04 | El coordinador/ADMIN gestiona el ciclo de vida de alertas: `OPEN` → `ACKNOWLEDGED` → `RESOLVED`. | A |
| RF-FU-05 | El sistema permite ejecutar la evaluación a demanda (`POST /risk-assessments/run`, con `studentIds` opcionales) y devolver `{ evaluated, alertsCreated }`. | B |

### 3.7 Módulo reporting (RF-RE)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-RE-01 | Reporte de asistencia por sección y rango de fechas (presentes/ausentes/justificados por fecha). | A |
| RF-RE-02 | Reporte de riesgo por estudiante (tasa de ausentismo, score y nivel) con filtro de carrera. | B |
| RF-RE-03 | Reporte de carga docente por término (secciones y estudiantes por docente). | B |
| RF-RE-04 | Exportación de reportes a XLSX y PDF (`format=xlsx\|pdf`) con `Content-Disposition`. | A |

### 3.8 Módulo audit (RF-AU)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-AU-01 | El sistema registra automáticamente toda mutación sensible (asistencia, justificaciones, usuarios/roles, políticas): usuario, acción, entidad, antes/después, IP y user-agent. | A |
| RF-AU-02 | El ADMIN consulta el registro paginado con filtros por tipo de entidad y usuario (`GET /audit`). | A |
| RF-AU-03 | El `AuditLog` es de solo inserción: no existen endpoints ni permisos de modificación o borrado. | A |

## 4. Requisitos no funcionales

| ID | Categoría | Requisito |
|---|---|---|
| RNF-01 | Rendimiento | Los listados paginados responden en < 500 ms (p95) con 10 000 registros; el marcado masivo de una sección de 40 estudiantes responde en < 1 s. |
| RNF-02 | Seguridad | Contraseñas con argon2; JWT con expiración ≤ 8 h; RBAC en el 100 % de los endpoints salvo `@Public()`; rate limit 10 r/s por IP en `/api/`; validación de entrada en todos los endpoints; cabeceras de seguridad vía nginx (ver ADR-003). |
| RNF-03 | Disponibilidad | 99,5 % de disponibilidad en horario lectivo; health checks en API, contenedores y compose; reinicio automático (`restart: unless-stopped`). |
| RNF-04 | Usabilidad | SPA responsive; el marcado completo de una sección en ≤ 3 interacciones; mensajes de error en español; compatible con Chrome/Edge/Firefox actuales desde 1366×768. |
| RNF-05 | Mantenibilidad | TypeScript estricto; ≥ 70 % de cobertura en la API; CI obligatorio (build + unitarias) para hacer merge en `main`; documentación `docs/` actualizada en el mismo PR. |
| RNF-06 | Integridad | Toda corrección de asistencia y toda decisión de justificación quedan registradas en `AuditLog` (RF-AU-01); transaccionalidad entre el cambio de estado y su auditoría. |
| RNF-07 | Escalabilidad | Paginación obligatoria en todos los listados; pool de conexiones de Prisma dimensionado; la API es stateless (detrás de nginx). |
| RNF-08 | Portabilidad | El sistema se levanta con `docker compose` en Linux y Windows (Docker Desktop); imágenes basadas en Alpine. |

## 5. Restricciones del sistema

| # | Restricción |
|---|---|
| R-01 | Monorepo pnpm con la estructura `apps/api`, `apps/web`, `e2e` (ADR-001). |
| R-02 | Stack fijado: NestJS 11, Prisma 6, PostgreSQL 16, React 19, Vite 7 (ADR-002). |
| R-03 | API REST versionada bajo `/api/v1`, contrato congelado en `docs/api-routes.md`. |
| R-04 | Adjuntos en almacenamiento local con volumen Docker, sin servicios externos (ADR-004). |
| R-05 | Idioma de interfaz y documentación: español; identificadores técnicos en inglés. |
| R-06 | Sin acceso a internet garantizado en entornos de práctica: todo el sistema debe operar de forma autocontenida (Docker local). |

## 6. Criterios de aceptación (alta prioridad)

| # | Criterio (dado/cuando/entonces) |
|---|---|
| CA-01 | **Dado** un usuario válido, **cuando** hace login, **entonces** recibe un JWT y su perfil; **con** credenciales inválidas recibe 401 sin filtrar información. |
| CA-02 | **Dado** un DOCENTE con sesión `IN_PROGRESS`, **cuando** marca la sección completa (bulk), **entonces** todos los matriculados tienen registro y la operación responde `{ created, updated }`. |
| CA-03 | **Dado** un registro `ABSENT`, **cuando** el estudiante envía justificación con adjunto y el coordinador aprueba, **entonces** el registro pasa a `JUSTIFIED` y existe `AuditLog` con `before`/`after`. |
| CA-04 | **Dado** un estudiante que supera el máximo de ausencias de una política activa, **cuando** se ejecuta la evaluación de riesgo, **entonces** se crea exactamente una alerta `OPEN` y un `RiskAssessment` con el nivel esperado. |
| CA-05 | **Dado** el ADMIN, **cuando** exporta el reporte de asistencia de una sección en XLSX y PDF, **entonces** descarga archivos válidos con el rango de fechas solicitado. |
| CA-06 | **Dado** el ADMIN, **cuando** consulta `GET /audit`, **entonces** ve las correcciones de asistencia con usuario, IP y valores antes/después; un rol no autorizado recibe 403. |
| CA-07 | **Dado** un token expirado o manipulado, **cuando** se usa en un endpoint protegido, **entonces** la API responde 401 y no ejecuta la operación. |
