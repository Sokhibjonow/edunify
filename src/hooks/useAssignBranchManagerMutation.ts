import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignBranchManager } from '@/services/branchService'
import type { AssignBranchManagerInput } from '@/types/branch'

export function useAssignBranchManagerMutation(orgId: string, branchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignBranchManagerInput) => assignBranchManager(orgId, branchId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchManagers', orgId] })
    },
  })
}
