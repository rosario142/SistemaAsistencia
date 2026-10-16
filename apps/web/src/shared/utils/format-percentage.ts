/**
 * Formatea porcentajes de forma tolerante al formato del backend:
 * - valores en rango 0–1 se tratan como fracción (0.123 → "12,3 %").
 * - valores > 1 ya vienen en porcentaje (25 → "25 %").
 *
 * `absencePercentageThreshold` y `absencesRate` del backend están en 0–100,
 * por lo que en la práctica casi siempre se recibe el segundo caso.
 */
export function formatPercentage(
  value: number | null | undefined,
  fractionDigits = 1,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const percent = Math.abs(value) <= 1 ? value * 100 : value;
  return `${percent.toLocaleString('es-ES', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })} %`;
}
