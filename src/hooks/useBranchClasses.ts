import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  createBranchClass,
  deleteBranchClass,
  listBranchClasses,
  updateBranchClass,
} from '@/services/branchClassService'
import type { CreateBranchClassInput, UpdateBranchClassInput } from '@/types/branchClass'

export function useBranchClassesQuery(orgId: string | null | undefined, branchId: string | null | undefined) {
  return useQuery({
    queryKey: ['org', orgId, 'branches', branchId, 'classes'],
    queryFn: () => listBranchClasses(orgId!, branchId!),
    enabled: !!orgId && !!branchId,
  })
}

/** Classes drive billing (payments page), the manager home and statistics. */
function invalidateBranch(queryClient: QueryClient, orgId: string, branchId: string) {
  queryClient.invalidateQueries({ queryKey: ['org', orgId, 'branches', branchId] })
  queryClient.invalidateQueries({ queryKey: ['statistics', orgId] })
}

export function useCreateBranchClassMutation(orgId: string, branchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBranchClassInput) => createBranchClass(orgId, branchId, input),
    onSuccess: () => invalidateBranch(queryClient, orgId, branchId),
  })
}

export function useUpdateBranchClassMutation(orgId: string, branchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, ...input }: UpdateBranchClassInput & { classId: string }) =>
      updateBranchClass(orgId, branchId, classId, input),
    onSuccess: () => invalidateBranch(queryClient, orgId, branchId),
  })
}

export function useDeleteBranchClassMutation(orgId: string, branchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (classId: string) => deleteBranchClass(orgId, branchId, classId),
    onSuccess: () => invalidateBranch(queryClient, orgId, branchId),
  })
}
