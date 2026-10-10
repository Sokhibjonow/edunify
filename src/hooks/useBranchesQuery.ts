import { useQuery } from '@tanstack/react-query'
import { listBranches } from '@/services/branchService'

export function useBranchesQuery(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ['branches', orgId],
    queryFn: () => listBranches(orgId!),
    enabled: !!orgId,
  })
}
