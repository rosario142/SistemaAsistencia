#!/usr/bin/env bash
# =============================================================================
# SICAE — Restauración de PostgreSQL desde un backup .sql.gz
#
# Uso:
#   ./restore.sh backups/sicae_20261015_030000.sql.gz
#
# Variables:
#   DATABASE_URL   destino de la restauración (por defecto la BD local)
#
# ADVERTENCIA: la restauración sobrescribe los datos existentes en las tablas
# del volcado. El script pide confirmación explícita antes de continuar.
# =============================================================================
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Uso: $0 <archivo.sql.gz>" >&2
  exit 1
fi

FILE="$1"
: "${DATABASE_URL:=postgresql://sicae:sicae_secret@localhost:5432/sicae}"

command -v psql >/dev/null 2>&1 || {
  echo "[restore] ERROR: no se encontró psql en el PATH." >&2
  exit 1
}

if [ ! -f "${FILE}" ]; then
  echo "[restore] ERROR: no existe el archivo: ${FILE}" >&2
  exit 1
fi

# Verificamos el gzip antes de tocar la base de datos.
gzip -t "${FILE}" || {
  echo "[restore] ERROR: el archivo está corrupto: ${FILE}" >&2
  exit 1
}

HOST_DB="$(printf '%s' "${DATABASE_URL}" | sed -E 's#^[^/]+://([^@]+@)?([^/:]+).*#\2#')"
echo "=============================================================="
echo " ATENCIÓN: se sobrescribirán los datos de la base de destino."
echo "   Archivo : ${FILE}"
echo "   Host    : ${HOST_DB}"
echo "   DATABASE_URL apunta a la base configurada en tu entorno."
echo "=============================================================="
printf "¿Continuar con la restauración? [y/N] "
read -r ANSWER
case "${ANSWER}" in
  [yY] | [yY][eE][sS]) ;;
  *) echo "[restore] Cancelado por el usuario."; exit 0 ;;
esac

echo "[restore] Restaurando ${FILE}..."
gunzip -c "${FILE}" | psql --quiet --no-psqlrc "${DATABASE_URL}"

echo "[restore] Restauración completada correctamente."
