#!/usr/bin/env bash
# =============================================================================
# SICAE — Backup horario de PostgreSQL
# Genera un volcado comprimido con marca de tiempo en BACKUP_DIR y elimina
# los backups con más de RETENTION_DAYS días.
#
# Uso:
#   ./backup.sh
#
# Variables (con valores por defecto):
#   DATABASE_URL     conexión libpq (por defecto la local de desarrollo)
#   BACKUP_DIR       directorio de salida (por defecto ./backups)
#   RETENTION_DAYS   retención en días (por defecto 7)
#
# Programación horaria con cron (0 * * * *):
#   0 * * * * cd /opt/sicae && DATABASE_URL="$PROD_URL" ./infrastructure/scripts/backup.sh >> /var/log/sicae-backup.log 2>&1
# =============================================================================
set -euo pipefail

: "${DATABASE_URL:=postgresql://sicae:sicae_secret@localhost:5432/sicae}"
: "${BACKUP_DIR:=./backups}"
: "${RETENTION_DAYS:=7}"

# Se necesita pg_dump (cliente de PostgreSQL 16+).
command -v pg_dump >/dev/null 2>&1 || {
  echo "[backup] ERROR: no se encontró pg_dump en el PATH." >&2
  exit 1
}

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILE="${BACKUP_DIR}/sicae_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[backup] Volcando base de datos → ${FILE}"
# pg_dump acepta la cadena de conexión como argumento. Se vuelca en SQL plano
# (sin owner/privileges) comprimido con gzip para inspección y restauración
# directa con psql.
pg_dump --no-owner --no-privileges "${DATABASE_URL}" | gzip -9 > "${FILE}"

echo "[backup] Verificando integridad del gzip..."
gzip -t "${FILE}"

echo "[backup] Aplicando retención: ${RETENTION_DAYS} días en ${BACKUP_DIR}"
find "${BACKUP_DIR}" -type f -name 'sicae_*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete

SIZE="$(du -h "${FILE}" | cut -f1)"
echo "[backup] Listo: ${FILE} (${SIZE})"
