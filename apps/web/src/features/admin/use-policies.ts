import { useQuery, useMutation, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { ApiError } from '@/shared/api-client/client';
import { followupApi } from '@/shared/api-client/endpoints';
import type { AttendancePolicy, CreatePolicyRequest, ListPoliciesParams, Page } from '@/shared/api-client/types';

export const policyKeys = {
  list: (params: ListPoliciesParams) => ['policies', 'list', params] as const,
};

export function usePolicies(
  params: ListPoliciesParams,
  options?: { enabled?: boolean },
): UseQueryResult<Page<AttendancePolicy>, ApiError> {
  return useQuery<Page<AttendancePolicy>, ApiError>({
    queryKey: policyKeys.list(params),
    enabled: options?.enabled ?? true,
    queryFn: () => followupApi.listPolicies(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreatePolicy(): UseMutationResult<
  AttendancePolicy,
  ApiError,
  CreatePolicyRequest
> {
  return useMutation<AttendancePolicy, ApiError, CreatePolicyRequest>({
    mutationFn: followupApi.createPolicy,
  });
}