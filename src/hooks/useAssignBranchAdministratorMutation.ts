import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignBranchAdministrator } from '@/services/branchService'
import type { AssignBranchAdministratorInput } from '@/types/branch'

export function useAssignBranchAdministratorMutation(orgId: string, branchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignBranchAdministratorInput) =>
      assignBranchAdministrator(orgId, branchId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchAdministrators', orgId] })
    },
  })
}
