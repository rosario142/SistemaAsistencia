import { useMutation, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ApiError } from '@/shared/api-client/client';
import { reportsApi } from '@/shared/api-client/endpoints';
import type {
  AttendanceBySectionParams,
  AttendanceBySectionReport,
  ExportFormat,
  StudentRiskReport,
  TeacherLoadReport,
} from '@/shared/api-client/types';

/** Tipos de reporte disponibles en la página. */
export type ReportKind = 'attendance-by-section' | 'student-risk' | 'teacher-load';

export const reportKeys = {
  attendanceBySection: (params: AttendanceBySectionParams) =>
    ['reports', 'attendance-by-section', params] as const,
  studentRisk: (careerId: string) => ['reports', 'student-risk', careerId] as const,
  teacherLoad: (termId: string) => ['reports', 'teacher-load', termId] as const,
};

/** GET /reports/attendance-by-section — asistencia de una sección en un rango. */
export function useAttendanceBySection(
  params: AttendanceBySectionParams,
  enabled: boolean,
): UseQueryResult<AttendanceBySectionReport, ApiError> {
  return useQuery<AttendanceBySectionReport, ApiError>({
    queryKey: reportKeys.attendanceBySection(params),
    enabled,
    queryFn: () => reportsApi.attendanceBySection(params),
  });
}

/** GET /reports/student-risk — tasas de inasistencia y nivel de riesgo. */
export function useStudentRisk(
  careerId: string,
  enabled: boolean,
): UseQueryResult<StudentRiskReport, ApiError> {
  return useQuery<StudentRiskReport, ApiError>({
    queryKey: reportKeys.studentRisk(careerId),
    enabled,
    queryFn: () => reportsApi.studentRisk(careerId || undefined),
  });
}

/** GET /reports/teacher-load — carga docente por periodo. */
export function useTeacherLoad(
  termId: string,
  enabled: boolean,
): UseQueryResult<TeacherLoadReport, ApiError> {
  return useQuery<TeacherLoadReport, ApiError>({
    queryKey: reportKeys.teacherLoad(termId),
    enabled,
    queryFn: () => reportsApi.teacherLoad(termId),
  });
}

export interface ExportAttendanceParams {
  sectionId: string;
  from: string;
  to: string;
}

/**
 * Descarga del reporte de asistencia (XLSX/PDF).
 * Disponível como mutación para mostrar estado de carga en el botón.
 */
export function useExportAttendance(): UseMutationResult<
  void,
  ApiError,
  { params: ExportAttendanceParams; format: ExportFormat }
> {
  return useMutation<void, ApiError, { params: ExportAttendanceParams; format: ExportFormat }>({
    mutationFn: ({ params, format }) => reportsApi.exportAttendance(params, format),
  });
}
