# ADR-003: Autenticación con JWT stateless y RBAC por guards

- **Estado**: Aceptado
- **Fecha**: 2026-10-15
- **Decisores**: Equipo SICAE

## Contexto

SICAE debe autenticar a cuatro roles con permisos muy distintos (`ADMIN`,
`COORDINADOR_ACADEMICO`, `DOCENTE`, `ESTUDIANTE`) y proteger la totalidad de la
API salvo el login y el flujo de recuperación de contraseña. La SPA React es
cliente del API y se sirve desde otro origen (o desde el mismo vía nginx), por
lo que la sesión no puede depender de cookies de servidor. Se necesita una
solución simple de operar detrás de nginx y verificable sin estado en el
servidor (sin tablas de sesión).

## Decisión

Autenticación **stateless con JWT (access token) + RBAC resuelto en guards**:

- `POST /auth/login` valida credenciales (hash **argon2**) y devuelve un
  `accessToken` JWT (claims: `sub`, `email`, `roles`) con `JWT_EXPIRES_IN=8h`.
- El cliente envía `Authorization: Bearer <token>` en cada petición.
- Un **guard global** (`AuthGuard`) rechaza todo lo no autenticado; los
  endpoints públicos se marcan explícitamente con `@Public()` (login,
  forgot-password, reset-password, health).
- La autorización se resuelve con `RolesGuard` + decorador `@Roles(...)`
  declarado por ruta según `docs/api-routes.md`; los permisos finos
  («solo mi matrícula», «solo mi sección») se validan en el caso de uso.
- **Los refresh tokens se descartan por ahora**: con expiración de 8 h y uso
  institucional diario, el coste de rotación/almacenamiento no se justifica.
  Se reevaluará si se detecta necesidad real (p. ej. apps móviles).

## Consecuencias

**Positivas**
- Cero estado en servidor: la API escala horizontalmente detrás del proxy.
- Los guards y decoradores hacen la política de acceso visible y auditable en
  cada controlador.
- Flujo estándar para la SPA: guardar token en memoria + refresco de página.

**Negativas / rieskos**
- Un JWT vigente no se puede revocar antes de expirar; se mitiga con
  expiración corta (8 h), desactivación lógica de usuarios (`active=false`,
  verificado en el guard) y rotación del `JWT_SECRET` si se filtra.
- Riesgo de almacenar el token en `localStorage` (XSS); se recomienda mantenerlo
  en memoria y usar la CSP de nginx (`infrastructure/nginx/nginx.conf`).
- Sin refresh tokens, el usuario volverá a iniciar sesión tras 8 h; aceptado
  como UX para uso institucional.

## Alternativas consideradas

- **Sesiones server-side (cookies + tabla `sessions`)**: revocación inmediata,
  pero introduce estado en el servidor, más latencia por consulta de sesión y
  fricción con el despliegue múltiple de la API. Descartado en esta fase.
- **Refresh tokens rotativos**: experiencia continua y revocación granular, pero
  añade tablas, endpoints y lógica de rotación/anti-theft. Diferible.
- **OAuth2/OIDC con proveedor externo (Keycloak, Auth0)**: SSO y MFA de serie,
  pero exige infraestructura y operación adicional fuera del alcance actual.
  Se considerará si la institución ya dispone de un IdP.
