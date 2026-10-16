# ADR-001: Monorepo con pnpm workspaces

- **Estado**: Aceptado
- **Fecha**: 2026-10-15
- **Decisores**: Equipo SICAE

## Contexto

SICAE nace con dos artefactos de aplicación que deben evolucionar al mismo tiempo
y comparten un contrato estricto: `apps/api` (NestJS + Prisma) publica la API
REST versionada bajo `/api/v1` y `apps/web` (React + Vite) la consume. El
contrato de rutas (`docs/api-routes.md`) y los tipos de respuesta deben
mantenerse sincronizados en cada cambio. Se suma un paquete `e2e` (Playwright)
que ensaya flujos completos sobre ambos artefactos.

Restricciones del proyecto: equipo pequeño (1-3 desarrolladores), sin
infraestructura de publicación de paquetes (no hay registry privado) y sin
tiempo para mantener pipelines y versionados múltiples.

## Decisión

Adoptamos un **monorepo** gestionado con **pnpm workspaces**:

- `apps/api`, `apps/web` y `e2e` son paquetes del workspace; la raíz expone los
  scripts orquestadores (`pnpm dev`, `pnpm build`, `pnpm test`).
- Las dependencias compartidas (TypeScript, ESLint, Prettier) se fijan una sola
  vez en la raíz; cada paquete declara solo las suyas.
- Las tareas por paquete se ejecutan con `pnpm --filter @sicae/api <script>`.
- Si en el futuro hace falta compartir tipos entre API y Web, se crea un paquete
  `packages/*` consumido con la sintaxis `workspace:*`.

pnpm se elige sobre npm/yarn por su uso eficiente de disco (hard-links), su
resolución estricta del lockfile (`pnpm-lock.yaml`) y el soporte nativo de
workspaces sin herramientas adicionales. La versión se fija en `"packageManager"`
y se activa con `corepack enable`.

## Consecuencias

**Positivas**
- Cambios atómicos: una modificación del contrato API y su consumidor viven en
  el mismo commit/PR; se elimina la sincronización manual entre repos.
- Un único pipeline de CI (`.github/workflows/ci.yml`) valida api + web + e2e
  de punta a punta.
- Instalaciones rápidas y deterministas con un único lockfile.

**Negativas / rieskos**
- El historial de git crece y mezcla dominios; se mitiga con prefijos de commit
  (`api:`, `web:`, `infra:`) y carpetas claras.
- `pnpm install` resuelve dependencias de todo el workspace; se mitiga con
  `--filter` en los comandos diarios.
- Riesgo de acoplamiento entre apps; se controla usando exclusivamente el
  contrato HTTP (`/api/v1`) como frontera, sin imports cruzados entre `apps/*`.

## Alternativas consideradas

- **Repositorios separados (api, web, e2e)**: aislamiento total y despliegues
  independientes, pero exige versionar y publicar paquetes compartidos,
  sincronizar el contrato manualmente y mantener múltiples pipelines. Coste
  desproporcionado para el tamaño del equipo.
- **npm workspaces / yarn workspaces**: funcionales, pero más lentos y con una
  semántica de instalación menos estricta (posibles «dependencias fantasma»
  que no están declaradas). Descartados en favor de pnpm.
- **Turborepo / Nx**: aportan caché remota y grafos de tareas, pero añaden
  complejidad y dependencias que todavía no se necesitan. Se reevaluará si el
  monorepo crece en paquetes y tiempo de CI.
