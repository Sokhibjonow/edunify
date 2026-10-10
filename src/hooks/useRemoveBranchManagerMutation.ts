import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeBranchManager } from '@/services/branchService'

export function useRemoveBranchManagerMutation(orgId: string, branchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (managerId: string) => removeBranchManager(orgId, branchId, managerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchManagers', orgId] })
    },
  })
}
