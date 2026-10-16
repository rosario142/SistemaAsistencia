import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { ApiError } from '@/shared/api-client/client';
import { justificationApi } from '@/shared/api-client/endpoints';
import type {
  Justification,
  ListJustificationsParams,
  Page,
  ReviewJustificationRequest,
  SubmitJustificationRequest,
} from '@/shared/api-client/types';

/** Claves de caché del dominio de justificaciones. */
export const justificationKeys = {
  all: ['justifications'] as const,
  list: (params: ListJustificationsParams) => ['justifications', 'list', params] as const,
};

/** Listado paginado de justificaciones con filtro de estado. */
export function useJustifications(
  params: ListJustificationsParams,
): UseQueryResult<Page<Justification>, ApiError> {
  return useQuery<Page<Justification>, ApiError>({
    queryKey: justificationKeys.list(params),
    queryFn: () => justificationApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Envío de una justificación (multipart con adjuntos, máximo 3).
 * Los archivos viajan en `attachments[]` junto a `attendanceRecordId` y `reason`.
 */
export function useSubmitJustification(): UseMutationResult<
  Justification,
  ApiError,
  SubmitJustificationRequest
> {
  const queryClient = useQueryClient();
  return useMutation<Justification, ApiError, SubmitJustificationRequest>({
    mutationFn: (body) => justificationApi.submit(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: justificationKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

/** POST /justifications/:id/review — aprueba o rechaza con comentario opcional. */
export function useReviewJustification(): UseMutationResult<
  Justification,
  ApiError,
  { justificationId: string; body: ReviewJustificationRequest }
> {
  const queryClient = useQueryClient();
  return useMutation<Justification, ApiError, { justificationId: string; body: ReviewJustificationRequest }>({
    mutationFn: ({ justificationId, body }) => justificationApi.review(justificationId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: justificationKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
