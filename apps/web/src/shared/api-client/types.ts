/**
 * Tipos espejo del contrato HTTP descrito en `docs/api-routes.md` (prefijo `/api/v1`).
 * Las enumeraciones replican exactamente los enums del esquema Prisma del backend.
 */

// ---------------------------- Genéricos ----------------------------

/** Envoltura estándar de los listados paginados. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Parámetros comunes de paginación. */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// ---------------------------- Identidad ----------------------------

/** Nombres de rol válidos en el sistema (enum `RoleName` de Prisma). */
export type RoleName = 'ADMIN' | 'COORDINADOR_ACADEMICO' | 'DOCENTE' | 'ESTUDIANTE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  active: boolean;
  roles: RoleName[];
  createdAt: string;
}

export interface RoleResponse {
  id: string;
  name: RoleName;
  description: string | null;
  permissions: Array<{ code: string; description: string | null }>;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleNames: RoleName[];
}

export interface AssignRolesRequest {
  roleNames: RoleName[];
}

export interface ListUsersParams extends PaginationParams {
  q?: string;
  active?: boolean;
}

// ---------------------------- Académico ----------------------------

export interface Career {
  id: string;
  code: string;
  name: string;
  degree: string | null;
  active: boolean;
}

export interface Term {
  id: string;
  careerId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Course {
  id: string;
  careerId: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
}

export interface Section {
  id: string;
  courseId: string;
  termId: string;
  teacherId: string | null;
  name: string;
  capacity: number;
  course?: Course;
}

export interface Schedule {
  id: string;
  sectionId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
}

/** Estado de una sesión de clase (enum `ClassSessionStatus`). */
export type ClassSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED';

export interface ClassSession {
  id: string;
  sectionId: string;
  date: string;
  topic: string | null;
  status: ClassSessionStatus;
  startedAt: string | null;
  closedAt: string | null;
  section: {
    id: string;
    name: string;
    course: { name: string };
  };
}

export interface CreateSessionRequest {
  sectionId: string;
  date: string;
  topic?: string;
}

export interface ListSessionsParams extends PaginationParams {
  sectionId?: string;
  /** Fecha exacta en formato ISO (yyyy-MM-dd). */
  date?: string;
  status?: ClassSessionStatus;
}

// ---------------------------- Matrícula ----------------------------

/** Estado de matrícula (enum `EnrollmentStatus`). */
export type EnrollmentStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Student {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  careerId: string | null;
}

export interface Enrollment {
  id: string;
  studentId: string;
  sectionId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  /** Relación incluida cuando el backend la resuelve; se usa como respaldo `studentId`. */
  student?: Student;
}

export interface ListEnrollmentsParams extends PaginationParams {
  sectionId?: string;
  studentId?: string;
  status?: EnrollmentStatus;
}

export interface ListStudentsParams extends PaginationParams {
  q?: string;
  careerId?: string;
}

// ---------------------------- Asistencia ----------------------------

/** Estado de un registro de asistencia (enum `AttendanceStatus`). */
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED' | 'EXCUSED';

/** Origen de la marca (enum `AttendanceSource`). */
export type AttendanceSource = 'MANUAL' | 'QR' | 'IMPORT';

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  source: AttendanceSource;
  notes: string | null;
  markedAt: string;
  markedById: string | null;
  correctedAt: string | null;
}

export interface ListAttendanceParams extends PaginationParams {
  sessionId?: string;
  studentId?: string;
  status?: AttendanceStatus;
}

export interface CreateAttendanceRequest {
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  source?: AttendanceSource;
  notes?: string;
}

export interface BulkMarkItem {
  studentId: string;
  status: AttendanceStatus;
}

export interface BulkMarkRequest {
  sessionId: string;
  marks: BulkMarkItem[];
}

export interface BulkMarkResponse {
  created: number;
  updated: number;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  justified: number;
  late: number;
  /** Porcentaje de inasistencias (0–100). */
  absenceRate: number;
}

// ---------------------------- Justificaciones ----------------------------

/** Estado de una justificación (enum `JustificationStatus`). */
export type JustificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ReviewDecision = 'APPROVED' | 'REJECTED';

export interface JustificationAttachment {
  id: string;
  fileName: string;
  url: string;
}

export interface Justification {
  id: string;
  attendanceRecordId: string;
  studentId: string;
  reason: string;
  status: JustificationStatus;
  submittedAt: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  attachments: JustificationAttachment[];
}

export interface ListJustificationsParams extends PaginationParams {
  status?: JustificationStatus;
  studentId?: string;
}

export interface SubmitJustificationRequest {
  attendanceRecordId: string;
  reason: string;
  /** Archivos adjuntos (multipart, máximo 3). */
  attachments: File[];
}

export interface ReviewJustificationRequest {
  decision: ReviewDecision;
  comment?: string;
}

// ---------------------------- Seguimiento ----------------------------

/** Política de asistencia (modelo `AttendancePolicy`). */
export interface AttendancePolicy {
  id: string;
  name: string;
  maxAbsences: number;
  /** Umbral de inasistencias en porcentaje (0–100). */
  absencePercentageThreshold: number;
  toleranceMinutes: number;
  careerId: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreatePolicyRequest {
  name: string;
  maxAbsences: number;
  absencePercentageThreshold: number;
  toleranceMinutes: number;
  careerId?: string;
  active: boolean;
}

export interface ListPoliciesParams extends PaginationParams {
  active?: boolean;
}

/** Severidad de alerta/riesgo (enum `AlertSeverity`). */
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Estado de una alerta (enum `AlertStatus`). */
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  studentId: string | null;
  sectionId: string | null;
  policyId: string | null;
}

export interface ListAlertsParams extends PaginationParams {
  status?: AlertStatus;
  severity?: AlertSeverity;
}

export interface RiskAssessment {
  id: string;
  evaluatedAt: string;
  totalSessions: number;
  absences: number;
  justifiedAbsences: number;
  absencesRate: number;
  riskScore: number;
  level: AlertSeverity;
  studentId: string;
}

// ---------------------------- Reportes ----------------------------

export interface AttendanceBySectionParams {
  sectionId: string;
  from: string;
  to: string;
}

export interface AttendanceBySectionRow {
  date: string;
  present: number;
  absent: number;
  justified: number;
}

export interface AttendanceBySectionReport {
  section: Section | { id: string; name?: string };
  rows: AttendanceBySectionRow[];
}

export interface StudentRiskReport {
  rows: Array<{
    student: Student | { id: string; firstName?: string; lastName?: string; code?: string };
    absenceRate: number;
    riskScore: number;
    level: AlertSeverity;
  }>;
}

export interface TeacherLoadReport {
  rows: Array<{
    teacher: User | { id: string; firstName?: string; lastName?: string };
    sections: number;
    students: number;
  }>;
}

export type ExportFormat = 'xlsx' | 'pdf';

// ---------------------------- Auditoría ----------------------------

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
