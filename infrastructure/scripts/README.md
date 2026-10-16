# Scripts de operación — SICAE

Utilidades bash para la gestión de la base de datos PostgreSQL de SICAE.
Están pensadas para ejecutarse en el servidor (Linux o contenedor), pero
funcionan igualmente en **Windows desde Git Bash o WSL** (ver más abajo).

| Script | Descripción |
|---|---|
| `backup.sh` | Volcado horario (`pg_dump` + gzip) con marca de tiempo y retención de 7 días |
| `restore.sh` | Restauración desde un `.sql.gz` con confirmación explícita |

## Requisitos

- `bash` (Git Bash o WSL en Windows).
- Cliente de PostgreSQL 16+ en el PATH: al menos `pg_dump` y `psql`.
  - Ubuntu/Debian: `sudo apt install postgresql-client-16`
  - Windows (winget): `winget install PostgreSQL.PostgreSQL.16` o copiar los binarios del cliente.
- Variable `DATABASE_URL` con la cadena de conexión libpq.

## backup.sh

```bash
# Backup de la BD local de desarrollo (valores por defecto)
./infrastructure/scripts/backup.sh

# Backup de producción con directorio y retención propios
DATABASE_URL="postgresql://sicae:SECRETO@db.tudominio.edu:5432/sicae" \
BACKUP_DIR="/var/backups/sicae" \
RETENTION_DAYS=14 \
./infrastructure/scripts/backup.sh
```

- Salida: `${BACKUP_DIR}/sicae_AAAAmmdd_HHMMSS.sql.gz` (por defecto `./backups/`).
- Verifica la integridad del gzip tras generar el volcado (`gzip -t`).
- Borra volcados de más de `RETENTION_DAYS` días (7 por defecto).
- `backups/` está en `.gitignore`: nunca se versiona.

### Programación con cron (horario)

```cron
# Cada hora, a las 00 minutos, con log propio
0 * * * * cd /opt/sicae && DATABASE_URL="postgresql://sicae:SECRETO@localhost:5432/sicae" ./infrastructure/scripts/backup.sh >> /var/log/sicae-backup.log 2>&1
```

En Windows no hay cron nativo: usa **Task Scheduler** apuntando a `bash.exe`
(Git Bash) con el script, o un contenedor/alpine con los clientes de PG.

## restore.sh

```bash
# Restaurar el backup más reciente (pidirá confirmación)
./infrastructure/scripts/restore.sh backups/sicae_20261015_030000.sql.gz

# Restaurar en la BD local apuntando a un entorno concreto
DATABASE_URL="postgresql://sicae:sicae_secret@localhost:5432/sicae" \
./infrastructure/scripts/restore.sh backups/sicae_20261015_030000.sql.gz
```

> **Peligro**: la restauración sobrescribe los datos existentes. El script
> muestra el archivo y el host de destino y exige responder `y` para continuar.
> Recomendación: hacer siempre un backup (`backup.sh`) justo antes de restaurar.

## Ejecución en Windows (Git Bash / WSL)

Los scripts usan finales de línea **LF** y son compatibles con Git Bash y WSL:

```bash
# Git Bash (C:\Program Files\Git\bin\bash.exe)
cd /d/SistemaAsistencia
./infrastructure/scripts/backup.sh

# WSL
wsl bash /mnt/d/SistemaAsistencia/infrastructure/scripts/backup.sh
```

Asegúrate de que `git config core.autocrlf` no convierta los `.sh` a CRLF al
hacer checkout (en Windows, `core.autocrlf=input` o `false`); si el ejecutable
falla con `$'\r': command not found`, ejecuta `dos2unix infrastructure/scripts/*.sh`.
