import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBranch } from '@/services/branchService'
import type { CreateBranchInput } from '@/types/branch'

export function useCreateBranchMutation(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBranchInput) => createBranch(orgId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', orgId] })
    },
  })
}
