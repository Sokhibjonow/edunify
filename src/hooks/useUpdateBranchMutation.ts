import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateBranch } from '@/services/branchService'
import type { Branch, UpdateBranchInput } from '@/types/branch'

type Variables = { branchId: string; input: UpdateBranchInput }

export function useUpdateBranchMutation(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ branchId, input }: Variables) => updateBranch(orgId, branchId, input),
    onSuccess: (data) => {
      queryClient.setQueryData<Branch[]>(['branches', orgId], (current) =>
        current?.map((b) => (b.id === data.id ? data : b)),
      )
      queryClient.invalidateQueries({ queryKey: ['branches', orgId] })
    },
  })
}
