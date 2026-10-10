import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteBranch } from '@/services/branchService'

export function useDeleteBranchMutation(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (branchId: string) => deleteBranch(orgId, branchId),
    onSuccess: (_data, branchId) => {
      queryClient.invalidateQueries({ queryKey: ['branches', orgId] })
      queryClient.invalidateQueries({ queryKey: ['branchManagers', orgId, branchId] })
    },
  })
}
