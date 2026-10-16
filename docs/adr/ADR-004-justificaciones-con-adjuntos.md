# ADR-004: Adjuntos de justificaciones en almacenamiento local con volumen

- **Estado**: Aceptado
- **Fecha**: 2026-10-15
- **Decisores**: Equipo SICAE

## Contexto

El flujo de justificación permite al estudiante adjuntar archivos (certificado
médico, constancia, etc.) a `POST /justifications` (multipart). Requisitos
implícitos: los adjuntos deben sobrevivir a los reinicios del contenedor de la
API, no deben servirse de forma pública sin autenticación, y el volumen esperado
es bajo (PDF/imágenes de unas pocas decenas de KB a unos MB por adjunto,
`client_max_body_size` de 20 MB en nginx). La institución no dispone en esta
fase de cuenta de almacenamiento en la nube (S3 u objeto equivalente) ni de un
MinIO autoalojado.

## Decisión

Almacenar los adjuntos en **sistema de archivos local del contenedor de la API**,
persistido mediante un **volumen nombrado de Docker**:

- `UPLOAD_DIR=/app/uploads` (en local, `./uploads`), con estructura
  `uploads/justifications/<uuid>/<nombre-original>`; el nombre en disco usa un
  UUID para evitar colisiones y path traversal.
- El volumen `uploads` está declarado en `infrastructure/docker/docker-compose.yml`
  y montado en el servicio `api`.
- La tabla `Attachment` en BD guarda `id`, `justificationId`, `fileName`,
  `storagePath` y `mimeType`; los binarios nunca se guardan en PostgreSQL.
- El servicio (`JustificationModule`) valida MIME (PDF/JPG/PNG) y tamaño antes
  de escribir; la descarga exige autenticación y autorización (dueño del
  registro, coordinador o admin) vía un endpoint del API, no exponiendo el
  volumen directamente en nginx.
- `UPLOAD_DIR` está en `.gitignore`: los archivos nunca se versionan.

## Consecuencias

**Positivas**
- Cero dependencias externas: el sistema completo se levanta con
  `docker compose up` sin servicios adicionales.
- Coste operativo mínimo y comportamiento predecible en desarrollo local.
- La ruta de descarga centralizada en el API permite aplicar RBAC y registrar
  accesos.

**Negativas / rieskos**
- El volumen vive en un solo host: un fallo de disco pierde los adjuntos. Se
  mitiga con copias del directorio en el backup periódico
  (`infrastructure/scripts/backup.sh` puede extenderse para incluir
  `${UPLOAD_DIR}`) y con el backup de la BD por separado.
- No hay réplica multi-instancia: si la API escala a varias réplicas, los
  adjuntos no son compartidos. Se solucionaría migrando a S3/MinIO.
- Es necesario un plan de limpieza de adjuntos huérfanos (justificaciones
  eliminadas); pendiente de definir.

## Alternativas consideradas

- **S3 / Azure Blob / Google Cloud Storage**: elástico, durable y multi-instancia,
  pero exige cuenta, credenciales y coste por almacenamiento/transferencia, más
  una capa de abstracción (SDK). Es la opción correcta a medio plazo; se
  reevaluará al superar el volumen de una institución grande o al requerir
  alta disponibilidad.
- **MinIO autoalojado (S3-compatible)**: evita el proveedor externo, pero añade
  un servicio más que operar (backups, monitoreo, actualizaciones) sin equipo
  dedicado de infraestructura. Descartado por ahora.
- **Guardar los binarios en PostgreSQL (`bytea`)**: simplifica el backup, pero
  infla la BD y las copias, degrada el rendimiento de las consultas y complica
  la streaming de descargas. Descartado.
