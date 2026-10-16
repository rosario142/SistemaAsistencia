import { useQuery, useMutation, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { ApiError } from '@/shared/api-client/client';
import { usersApi } from '@/shared/api-client/endpoints';
import type { User, CreateUserRequest, AssignRolesRequest, ListUsersParams, Page } from '@/shared/api-client/types';

export const userKeys = {
  list: (params: ListUsersParams) => ['users', 'list', params] as const,
};

export function useUsers(
  params: ListUsersParams,
  options?: { enabled?: boolean },
): UseQueryResult<Page<User>, ApiError> {
  return useQuery<Page<User>, ApiError>({
    queryKey: userKeys.list(params),
    enabled: options?.enabled ?? true,
    queryFn: () => usersApi.list(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateUser(): UseMutationResult<
  User,
  ApiError,
  CreateUserRequest
> {
  return useMutation<User, ApiError, CreateUserRequest>({
    mutationFn: usersApi.create,
  });
}

export function useAssignRoles(): UseMutationResult<
  User,
  ApiError,
  { userId: string; body: AssignRolesRequest }
> {
  return useMutation<User, ApiError, { userId: string; body: AssignRolesRequest }>({
    mutationFn: ({ userId, body }) => usersApi.assignRoles(userId, body),
  });
}