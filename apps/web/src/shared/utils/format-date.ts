/**
 * Utilidades de formato de fechas para la UI.
 * Las API devuelven ISO-8601 (UTC); se muestran en locale `es-ES`.
 */

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

const FULL_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formato corto de fecha: `09 mar 2026`. Devuelve el valor original si no es parseable. */
export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return typeof value === 'string' ? value : '—';
  return new Intl.DateTimeFormat('es-ES', DATE_TIME_OPTIONS).format(date);
}

/** Formato de fecha y hora: `09 mar 2026, 10:15`. */
export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return typeof value === 'string' ? value : '—';
  return new Intl.DateTimeFormat('es-ES', FULL_OPTIONS).format(date);
}

/**
 * Formatea valores `HH:mm` o ISO de hora (`10:15:00`, `1970-01-01T10:15:00.000Z`).
 * Devuelve tal cual si no se reconoce el patrón.
 */
export function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  const timeMatch = /^(\d{2}:\d{2})/.exec(value);
  if (timeMatch) return timeMatch[1];
  const date = toDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(date);
}

/** Fecha local en formato `yyyy-MM-dd` (para filtros `<input type="date">`). */
export function toInputDate(value: Date = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
