# ADR-002: NestJS + Prisma sobre PostgreSQL para la API

- **Estado**: Aceptado
- **Fecha**: 2026-10-15
- **Decisores**: Equipo SICAE

## Contexto

La API de SICAE debe modelar un dominio relacional con cardinalidades claras
(carrera → término → curso → sección → horario/sesión; estudiante → matrícula →
registro de asistencia), con transacciones puntuales (corrección de asistencia +
auditoría, aprobación de justificación + cambio de estado) y consultas
agregadas para reportes y evaluación de riesgo. Se requiere tipado estricto en
TypeScript, migraciones versionadas y un esquema legible como fuente de verdad.

## Decisión

Elegimos **NestJS 11 + Prisma 6 sobre PostgreSQL 16**:

- **NestJS** como framework HTTP: arquitectura modular por dominio (`identity`,
  `academic`, `enrollment`, `attendance`, `justification`, `followup`,
  `reporting`, `audit`), inyección de dependencias, guards/interceptors
  reutilizables (RBAC, auditoría) y validación con `class-validator`.
- **Prisma** como ORM: el `schema.prisma` es la especificación del modelo de
  datos; migraciones generadas y versionadas en `apps/api/prisma/migrations`;
  cliente tipado de fábrica y soporte nativo de `TIME`/`ENUM`.
- **PostgreSQL 16** como BD: transacciones ACID, constraints ricos
  (FK, únicos, check), `NUMERIC` para tasas de ausentismo e imágenes oficiales
  ligeras (`postgres:16-alpine`) con datos realistas en desarrollo.

Reglas: Prisma solo se usa en la capa `infrastructure` de cada módulo; los
casos de negocio no conocen `PrismaClient` ni los tipos generados.

## Consecuencias

**Positivas**
- Productividad alta: CRUD tipado de extremo a extremo y migraciones auditables.
- El esquema Prisma documenta el modelo de dominio para todo el equipo.
- Integración natural con el resto del stack TypeScript (web, e2e, CI).

**Negativas / rieskos**
- Prisma añade una dependencia fuerte al ecosistema; migrarla sería costoso.
- Consultas muy complejas de reporting pueden requerir SQL crudo
  (`$queryRaw`); se acota a la capa de `reporting`.
- El «N+1» es fácil de introducir: se mitiga con `include`/`select` explícitos
  y con pruebas de integración sobre los repositorios.

## Alternativas consideradas

- **TypeORM**: maduro y cercano a JPA, pero su tipado y su soporte de
  decoradores han generado históricamente más fricción que Prisma; las
  migraciones y el descubrimiento de esquema son menos fiables. Descartado.
- **Mongoose (MongoDB)**: modelo documento flexible, pero el dominio de SICAE
  es eminentemente relacional (integridad referencial, agregaciones por
  sección/término); se perderían constraints a cambio de nada. Descartado.
- **Express/Fastify sin framework**: mínimo y directo, pero obligaría a
  construir a mano módulos, DI, validación, guards y estructura de carpetas;
  NestJS ya estandariza todo eso. Descartado.
- **Django/FastAPI (Python)**: potentes, pero rompen el monorepo
  TypeScript único y obligan a dos toolchains y dos CI. Descartado.
