/**
 * Endpoints 1:1 con `docs/api-routes.md`.
 *
 * Cada objeto agrupa las rutas de un módulo del backend; las funciones devuelven
 * los tipos de `types.ts` y usan el cliente de `client.ts` (que ya añade el
 * prefijo `/api/v1` y el token Bearer).
 *
 * Nota: las rutas de matrícula (`/students`, `/enrollments`) se agrupan en
 * `academicApi` para respetar la lista cerrada de exports del frontend.
 */
import { api, download } from './client';
import type {
  AssignRolesRequest,
  AttendanceBySectionParams,
  AttendanceBySectionReport,
  AttendanceRecord,
  AttendanceSummary,
  BulkMarkRequest,
  BulkMarkResponse,
  Career,
  ClassSession,
  Course,
  CreateAttendanceRequest,
  CreatePolicyRequest,
  CreateSessionRequest,
  CreateUserRequest,
  Enrollment,
  ExportFormat,
  ListAlertsParams,
  ListAttendanceParams,
  ListEnrollmentsParams,
  ListJustificationsParams,
  ListPoliciesParams,
  ListSessionsParams,
  ListStudentsParams,
  ListUsersParams,
  LoginRequest,
  LoginResponse,
  Page,
  ReviewDecision,
  ReviewJustificationRequest,
  RoleResponse,
  Schedule,
  Section,
  Student,
  SubmitJustificationRequest,
  TeacherLoadReport,
  Term,
  User,
  Justification,
  AttendancePolicy,
  Alert,
  RiskAssessment,
  StudentRiskReport,
} from './types';

// ---------------------------- Identity ----------------------------

export const authApi = {
  /** POST /auth/login — `@Public()`. */
  login(body: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>('/auth/login', body);
  },
  /** GET /auth/me — perfil del token actual. */
  me(): Promise<User> {
    return api.get<User>('/auth/me');
  },
  /** POST /auth/forgot-password — `@Public()`. */
  forgotPassword(email: string): Promise<{ ok: true }> {
    return api.post<{ ok: true }>('/auth/forgot-password', { email });
  },
  /** POST /auth/reset-password — `@Public()`. */
  resetPassword(token: string, newPassword: string): Promise<{ ok: true }> {
    return api.post<{ ok: true }>('/auth/reset-password', { token, newPassword });
  },
};

// ---------------------------- Identity / Usuarios ----------------------------

export const usersApi = {
  /** GET /users — ADMIN. */
  list(params: ListUsersParams): Promise<Page<User>> {
    return api.get<Page<User>>('/users', { query: { ...params } });
  },
  /** POST /users — ADMIN. */
  create(body: CreateUserRequest): Promise<User> {
    return api.post<User>('/users', body);
  },
  /** POST /users/:id/roles — ADMIN (reemplaza la lista de roles). */
  assignRoles(userId: string, body: AssignRolesRequest): Promise<User> {
    return api.post<User>(`/users/${userId}/roles`, body);
  },
  /** GET /roles — ADMIN. */
  roles(): Promise<RoleResponse[]> {
    return api.get<RoleResponse[]>('/roles');
  },
};

// ---------------------------- Académico + Matrícula ----------------------------

export const academicApi = {
  /** GET /careers */
  careers(page = 1, pageSize = 100): Promise<Page<Career>> {
    return api.get<Page<Career>>('/careers', { query: { page, pageSize } });
  },
  /** POST /careers */
  createCareer(body: { code: string; name: string; degree?: string }): Promise<Career> {
    return api.post<Career>('/careers', body);
  },
  /** GET /terms */
  terms(page = 1, pageSize = 100): Promise<Page<Term>> {
    return api.get<Page<Term>>('/terms', { query: { page, pageSize } });
  },
  /** POST /terms */
  createTerm(body: { careerId: string; name: string; startDate: string; endDate: string }): Promise<Term> {
    return api.post<Term>('/terms', body);
  },
  /** GET /courses */
  courses(page = 1, pageSize = 100): Promise<Page<Course>> {
    return api.get<Page<Course>>('/courses', { query: { page, pageSize } });
  },
  /** GET /sections */
  sections(page = 1, pageSize = 100): Promise<Page<Section>> {
    return api.get<Page<Section>>('/sections', { query: { page, pageSize } });
  },
  /** GET /sections/:id/schedules */
  sectionSchedules(sectionId: string): Promise<Schedule[]> {
    return api.get<Schedule[]>(`/sections/${sectionId}/schedules`);
  },

  /** GET /sessions — listado paginado con filtros de fecha/estado. */
  listSessions(params: ListSessionsParams): Promise<Page<ClassSession>> {
    return api.get<Page<ClassSession>>('/sessions', { query: { ...params } });
  },
  /** POST /sessions — programa una sesión. */
  createSession(body: CreateSessionRequest): Promise<ClassSession> {
    return api.post<ClassSession>('/sessions', body);
  },
  /** POST /sessions/:id/start — pasa la sesión a IN_PROGRESS. */
  startSession(sessionId: string): Promise<ClassSession> {
    return api.post<ClassSession>(`/sessions/${sessionId}/start`);
  },
  /** POST /sessions/:id/close — cierra la sesión y dispara el cierre de asistencia. */
  closeSession(sessionId: string): Promise<ClassSession> {
    return api.post<ClassSession>(`/sessions/${sessionId}/close`);
  },

  /** GET /students */
  listStudents(params: ListStudentsParams): Promise<Page<Student>> {
    return api.get<Page<Student>>('/students', { query: { ...params } });
  },
  /** POST /students */
  createStudent(body: {
    code: string;
    firstName: string;
    lastName: string;
    email: string;
    careerId?: string;
  }): Promise<Student> {
    return api.post<Student>('/students', body);
  },
  /** GET /enrollments */
  listEnrollments(params: ListEnrollmentsParams): Promise<Page<Enrollment>> {
    return api.get<Page<Enrollment>>('/enrollments', { query: { ...params } });
  },
  /** POST /enrollments */
  createEnrollment(body: { studentId: string; sectionId: string }): Promise<Enrollment> {
    return api.post<Enrollment>('/enrollments', body);
  },
};

// ---------------------------- Asistencia ----------------------------

export const attendanceApi = {
  /** GET /attendance */
  list(params: ListAttendanceParams): Promise<Page<AttendanceRecord>> {
    return api.get<Page<AttendanceRecord>>('/attendance', { query: { ...params } });
  },
  /** POST /attendance — marca individual. */
  create(body: CreateAttendanceRequest): Promise<AttendanceRecord> {
    return api.post<AttendanceRecord>('/attendance', body);
  },
  /** POST /attendance/bulk — marcado masivo de una sesión. */
  bulk(body: BulkMarkRequest): Promise<BulkMarkResponse> {
    return api.post<BulkMarkResponse>('/attendance/bulk', body);
  },
  /** PATCH /attendance/:id — corrección con motivo (deja auditLog). */
  correct(recordId: string, body: { status: AttendanceRecord['status']; reason: string }): Promise<AttendanceRecord> {
    return api.patch<AttendanceRecord>(`/attendance/${recordId}`, body);
  },
  /** GET /attendance/summary */
  summary(studentId: string, termId?: string): Promise<AttendanceSummary> {
    return api.get<AttendanceSummary>('/attendance/summary', { query: { studentId, termId } });
  },
};

// ---------------------------- Justificaciones ----------------------------

export const justificationApi = {
  /** GET /justifications */
  list(params: ListJustificationsParams): Promise<Page<Justification>> {
    return api.get<Page<Justification>>('/justifications', { query: { ...params } });
  },
  /** GET /justifications/:id */
  get(justificationId: string): Promise<Justification> {
    return api.get<Justification>(`/justifications/${justificationId}`);
  },
  /**
   * POST /justifications — multipart `attendanceRecordId`, `reason`, `attachments[]`.
   * No se fuerza `Content-Type` para que el navegador genere el boundary.
   */
  submit(body: SubmitJustificationRequest): Promise<Justification> {
    const form = new FormData();
    form.append('attendanceRecordId', body.attendanceRecordId);
    form.append('reason', body.reason);
    for (const file of body.attachments) form.append('attachments[]', file);
    return api.post<Justification>('/justifications', form);
  },
  /** PATCH /justifications/:id/review — aprueba o rechaza con comentario. */
  review(
    justificationId: string,
    body: ReviewJustificationRequest,
  ): Promise<Justification> {
    return api.patch<Justification>(`/justifications/${justificationId}/review`, body);
  },
};

// ---------------------------- Seguimiento ----------------------------

export const followupApi = {
  /** GET /policies */
  listPolicies(params: ListPoliciesParams): Promise<Page<AttendancePolicy>> {
    return api.get<Page<AttendancePolicy>>('/policies', { query: { ...params } });
  },
  /** POST /policies */
  createPolicy(body: CreatePolicyRequest): Promise<AttendancePolicy> {
    return api.post<AttendancePolicy>('/policies', body);
  },
  /** GET /alerts */
  listAlerts(params: ListAlertsParams): Promise<Page<Alert>> {
    return api.get<Page<Alert>>('/alerts', { query: { ...params } });
  },
  /** PATCH /alerts/:id/ack */
  acknowledgeAlert(alertId: string): Promise<Alert> {
    return api.patch<Alert>(`/alerts/${alertId}/ack`);
  },
  /** PATCH /alerts/:id/resolve */
  resolveAlert(alertId: string): Promise<Alert> {
    return api.patch<Alert>(`/alerts/${alertId}/resolve`);
  },
  /** GET /risk-assessments */
  listRiskAssessments(
    params: { page: number; pageSize: number; level?: string; studentId?: string },
  ): Promise<Page<RiskAssessment>> {
    return api.get<Page<RiskAssessment>>('/risk-assessments', { query: { ...params } });
  },
  /** POST /risk-assessments/run — ejecuta la evaluación de riesgo. */
  runRiskAssessments(studentIds?: string[]): Promise<{ evaluated: number; alertsCreated: number }> {
    return api.post<{ evaluated: number; alertsCreated: number }>('/risk-assessments/run', {
      ...(studentIds ? { studentIds } : {}),
    });
  },
};

// ---------------------------- Reportes ----------------------------

export const reportsApi = {
  /** GET /reports/attendance-by-section */
  attendanceBySection(params: AttendanceBySectionParams): Promise<AttendanceBySectionReport> {
    return api.get<AttendanceBySectionReport>('/reports/attendance-by-section', {
      query: { ...params },
    });
  },
  /** GET /reports/student-risk */
  studentRisk(careerId?: string): Promise<StudentRiskReport> {
    return api.get<StudentRiskReport>('/reports/student-risk', { query: { careerId } });
  },
  /** GET /reports/teacher-load */
  teacherLoad(termId: string): Promise<TeacherLoadReport> {
    return api.get<TeacherLoadReport>('/reports/teacher-load', { query: { termId } });
  },
  /**
   * GET /reports/export/attendance — descarga el archivo (XLSX o PDF)
   * con `Content-Disposition`. Dispara la descarga en el navegador.
   */
  exportAttendance(
    params: { sectionId: string; from: string; to: string },
    format: ExportFormat,
  ): Promise<void> {
    return download(
      '/reports/export/attendance',
      { ...params, format },
      `asistencia.${format}`,
    );
  },
};

// ---------------------------- Re-exportes de comodidad ----------------------------

/** Tipo de revisión de justificación (`decision` del endpoint de review). */
export type { ReviewDecision };
