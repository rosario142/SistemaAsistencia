import { cn } from '@/shared/utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Etiqueta accesible; úsalo como contenido del contenedor. */
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label = 'Cargando…', className }: SpinnerProps) {
  return (
    <span
      className={cn('spinner', `spinner--${size}`, className)}
      role="status"
      aria-label={label}
    />
  );
}

/** Centra el spinner a pantalla completa mientras se carga una página. */
export function SpinnerOverlay({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="spinner-overlay">
      <Spinner size="lg" label={label} />
    </div>
  );
}
