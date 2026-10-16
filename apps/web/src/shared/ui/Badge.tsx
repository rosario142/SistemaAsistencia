import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';
import type {
  AlertStatus,
  AttendanceStatus,
  ClassSessionStatus,
  EnrollmentStatus,
  JustificationStatus,
} from '@/shared/api-client/types';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

/** Colores por valor de estado; los no catalogados usan `neutral`. */
const ATTENDANCE_VARIANTS: Record<AttendanceStatus, BadgeVariant> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  LATE: 'warning',
  JUSTIFIED: 'info',
  EXCUSED: 'neutral',
};

const JUSTIFICATION_VARIANTS: Record<JustificationStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const SESSION_VARIANTS: Record<ClassSessionStatus, BadgeVariant> = {
  SCHEDULED: 'neutral',
  IN_PROGRESS: 'info',
  CLOSED: 'success',
  CANCELLED: 'danger',
};

const ALERT_VARIANTS: Record<AlertStatus, BadgeVariant> = {
  OPEN: 'danger',
  ACKNOWLEDGED: 'warning',
  RESOLVED: 'success',
};

const ENROLLMENT_VARIANTS: Record<EnrollmentStatus, BadgeVariant> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  COMPLETED: 'info',
  CANCELLED: 'danger',
};

const SEVERITY_VARIANTS: Record<string, BadgeVariant> = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Presente',
  ABSENT: 'Ausente',
  LATE: 'Tardanza',
  JUSTIFIED: 'Justificado',
  EXCUSED: 'Dispensado',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  SCHEDULED: 'Programada',
  IN_PROGRESS: 'En curso',
  CLOSED: 'Cerrada',
  CANCELLED: 'Cancelada',
  OPEN: 'Abierta',
  ACKNOWLEDGED: 'Reconocida',
  RESOLVED: 'Resuelta',
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
  COMPLETED: 'Completada',
  // CANCELLED comparte etiqueta para sesiones y matrículas ('Cancelada').
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
  ADMIN: 'Administrador',
  COORDINADOR_ACADEMICO: 'Coordinador académico',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
};

export function Badge({ variant = 'neutral', className, children }: BadgeProps) {
  return <span className={cn('badge', `badge--${variant}`, className)}>{children}</span>;
}

function variantFor(
  status: string,
  table: Record<string, BadgeVariant>,
): BadgeVariant {
  return table[status] ?? 'neutral';
}

/** Etiqueta en español para un estado arbitrario. */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function attendanceBadge(status: AttendanceStatus): BadgeProps {
  return { variant: variantFor(status, ATTENDANCE_VARIANTS), children: statusLabel(status) };
}

export function justificationBadge(status: JustificationStatus): BadgeProps {
  return { variant: variantFor(status, JUSTIFICATION_VARIANTS), children: statusLabel(status) };
}

export function sessionBadge(status: ClassSessionStatus): BadgeProps {
  return { variant: variantFor(status, SESSION_VARIANTS), children: statusLabel(status) };
}

export function alertBadge(status: AlertStatus): BadgeProps {
  return { variant: variantFor(status, ALERT_VARIANTS), children: statusLabel(status) };
}

export function severityBadge(severity: string): BadgeProps {
  return { variant: variantFor(severity, SEVERITY_VARIANTS), children: statusLabel(severity) };
}

export function enrollmentBadge(status: EnrollmentStatus): BadgeProps {
  return { variant: variantFor(status, ENROLLMENT_VARIANTS), children: statusLabel(status) };
}
