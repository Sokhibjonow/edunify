import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeBranchAdministrator } from '@/services/branchService'

export function useRemoveBranchAdministratorMutation(orgId: string, branchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (administratorId: string) =>
      removeBranchAdministrator(orgId, branchId, administratorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchAdministrators', orgId] })
    },
  })
}
