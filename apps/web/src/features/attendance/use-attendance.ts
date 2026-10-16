import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { academicApi, attendanceApi } from '@/shared/api-client/endpoints';
import type {
  AttendanceRecord,
  BulkMarkRequest,
  BulkMarkResponse,
  ClassSession,
  ClassSessionStatus,
  Enrollment,
  ListAttendanceParams,
  ListSessionsParams,
  Page,
  Student,
} from '@/shared/api-client/types';
import type { ApiError } from '@/shared/api-client/client';

/** Claves de caché de TanStack Query del dominio de asistencia. */
export const attendanceKeys = {
  sessions: (params: ListSessionsParams) => ['sessions', params] as const,
  sessionsByDate: (date: string) => ['sessions', 'by-date', date] as const,
  sessionDetail: (sessionId: string) => ['sessions', 'detail', sessionId] as const,
  records: (params: ListAttendanceParams) => ['attendance', 'records', params] as const,
  enrollments: (sectionId: string) => ['enrollments', sectionId] as const,
  studentsLookup: ['students', 'lookup'] as const,
  dashboard: ['dashboard'] as const,
};

export interface UseSessionsOptions {
  /** Mantiene la página anterior mientras carga la siguiente (evita saltos). */
  keepPrevious?: boolean;
}

/** Listado paginado de sesiones de clase con filtros de fecha/estado. */
export function useSessions(
  params: ListSessionsParams,
  options: UseSessionsOptions = {},
): UseQueryResult<Page<ClassSession>, ApiError> {
  return useQuery<Page<ClassSession>, ApiError>({
    queryKey: attendanceKeys.sessions(params),
    queryFn: () => academicApi.listSessions(params),
    placeholderData: options.keepPrevious === false ? undefined : keepPreviousData,
  });
}

/**
 * Detalle de una sesión.
 *
 * El contrato no expone `GET /sessions/:id`, así que se busca dentro del
 * listado (primeras 100 sesiones). `initialData` permite recibir la sesión
 * completa desde el listado vía `location.state` sin espera.
 */
export function useSession(
  sessionId: string,
  initialData?: ClassSession,
): UseQueryResult<ClassSession | null, ApiError> {
  return useQuery<ClassSession | null, ApiError>({
    queryKey: attendanceKeys.sessionDetail(sessionId),
    enabled: Boolean(sessionId),
    staleTime: 5 * 60_000,
    initialData: initialData ? () => initialData : undefined,
    queryFn: async () => {
      const page = await academicApi.listSessions({ page: 1, pageSize: 100 });
      return page.items.find((session) => session.id === sessionId) ?? null;
    },
  });
}

/** Sesiones de un día concreto (usada por el panel de inicio: "sesiones hoy"). */
export function useSessionsByDate(
  date: string,
  pageSize = 1,
): UseQueryResult<Page<ClassSession>, ApiError> {
  return useQuery<Page<ClassSession>, ApiError>({
    queryKey: attendanceKeys.sessionsByDate(date),
    enabled: Boolean(date),
    queryFn: () => academicApi.listSessions({ page: 1, pageSize, date }),
  });
}

/** Registros de asistencia (por sesión, estudiante u estado). */
export function useAttendance(
  params: ListAttendanceParams,
  enabled = true,
): UseQueryResult<Page<AttendanceRecord>, ApiError> {
  return useQuery<Page<AttendanceRecord>, ApiError>({
    queryKey: attendanceKeys.records(params),
    enabled: enabled && Boolean(params.sessionId || params.studentId || params.status),
    placeholderData: keepPreviousData,
    queryFn: () => attendanceApi.list(params),
  });
}

/** Matrículas de una sección (define la lista de estudiantes a marcar). */
export function useEnrollments(
  sectionId: string | undefined,
  enabled = true,
): UseQueryResult<Page<Enrollment>, ApiError> {
  return useQuery<Page<Enrollment>, ApiError>({
    queryKey: attendanceKeys.enrollments(sectionId ?? ''),
    enabled: enabled && Boolean(sectionId),
    queryFn: () =>
      academicApi.listEnrollments({ page: 1, pageSize: 500, sectionId, status: 'ACTIVE' }),
  });
}

/**
 * Respaldo de datos de estudiantes: solo se consulta si alguna matrícula no
 * incluye la relación `student`.
 */
export function useStudentsLookup(enabled: boolean): UseQueryResult<Page<Student>, ApiError> {
  return useQuery<Page<Student>, ApiError>({
    queryKey: attendanceKeys.studentsLookup,
    enabled,
    staleTime: 5 * 60_000,
    queryFn: () => academicApi.listStudents({ page: 1, pageSize: 500 }),
  });
}

/** POST /attendance/bulk — guarda el marcado masivo de la sesión. */
export function useMarkBulk(): UseMutationResult<BulkMarkResponse, ApiError, BulkMarkRequest> {
  const queryClient = useQueryClient();
  return useMutation<BulkMarkResponse, ApiError, BulkMarkRequest>({
    mutationFn: (body) => attendanceApi.bulk(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.dashboard });
    },
  });
}

/** POST /sessions/:id/close — cierra la sesión (invalida listados y marcado). */
export function useCloseSession(): UseMutationResult<ClassSession, ApiError, string> {
  const queryClient = useQueryClient();
  return useMutation<ClassSession, ApiError, string>({
    mutationFn: (sessionId) => academicApi.closeSession(sessionId),
    onSuccess: async (session) => {
      queryClient.setQueryData(attendanceKeys.sessionDetail(session.id), session);
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.dashboard });
    },
  });
}
