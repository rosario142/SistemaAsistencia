# CI de SICAE — documentación

## ¿Por qué la documentación vive aquí y no los workflows?

**GitHub Actions exige que los workflows residan en `.github/workflows/`** del
repositorio (esa es la única ruta que GitHub detecta y ejecuta). Por eso el
pipeline real está en:

```
.github/workflows/ci.yml
```

Este directorio (`infrastructure/ci/`) contiene **la documentación** del
pipeline para que la infraestructura del repo sea coherente: aquí se explica
qué hace el CI, cómo replicarlo en local y cómo ampliarlo (e2e con servicios).

## Pipeline actual (`.github/workflows/ci.yml`)

- **Disparadores**: `push` y `pull_request` sobre la rama `main`.
- **Runner**: `ubuntu-latest`.
- **Job `build-test`** (secuencial, sin paralelismo aún):

| Paso | Comando / Acción | Propósito |
|---|---|---|
| Checkout | `actions/checkout@v4` | Código del monorepo |
| pnpm | `pnpm/action-setup@v4` (lee `packageManager`) | Equivalente a `corepack enable`; debe ir antes de setup-node para que la caché de pnpm funcione |
| Node | `actions/setup-node@v4` (node 22, `cache: pnpm`) | Runtime + caché del store de pnpm entre ejecuciones |
| Instalar | `pnpm install --frozen-lockfile` | Instalación reproducible; falla si el lockfile está desincronizado |
| Prisma | `pnpm --filter @sicae/api prisma:generate` + `prisma:validate` | Cliente generado y schema válido |
| Build API | `pnpm --filter @sicae/api build` | Compilación NestJS (typecheck incluido) |
| Build Web | `pnpm --filter @sicae/web build` | Compilación Vite del SPA |
| Tests | `pnpm --filter @sicae/api test` | Unitarias (Jest, sin BD) |

## Ampliación prevista: e2e con PostgreSQL

Las pruebas Playwright (`e2e/`) necesitan una API con base de datos. El patrón
recomendado en GitHub Actions es un job independiente con **servicios**:

```yaml
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: sicae
          POSTGRES_PASSWORD: sicae_secret
          POSTGRES_DB: sicae
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U sicae -d sicae"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @sicae/api prisma:generate
      - run: pnpm --filter @sicae/api db:migrate        # contra el servicio
      - run: pnpm --filter @sicae/api db:seed
      - run: pnpm --filter @sicae/api build
      - run: pnpm --filter @sicae/web build
      - run: npx playwright install --with-deps chromium
      - run: pnpm -C e2e test
        env:
          DATABASE_URL: postgresql://sicae:sicae_secret@localhost:5432/sicae
```

Se deja comentado en `ci.yml` hasta que el flujo e2e esté estable, para no
frenar el merge de PR con tests aún en construcción.

## Replicar el CI en local

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @sicae/api prisma:generate
pnpm --filter @sicae/api prisma:validate
pnpm --filter @sicae/api build
pnpm --filter @sicae/web build
pnpm --filter @sicae/api test
```

Si estos 6 comandos pasan en local, el job `build-test` pasa en CI.

## Convenciones

- Los workflows llevan comentarios en español y nombres de pasos descriptivos.
- Cualquier cambio de pipeline se documenta aquí y se aprueba en PR.
- `concurrency` en el workflow cancela ejecuciones obsoletas de la misma rama.
