import { useQuery } from '@tanstack/react-query'
import { getBranchStudentCounts } from '@/services/branchService'

export function useBranchStudentCountsQuery(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ['branchStudentCounts', orgId],
    queryFn: () => getBranchStudentCounts(orgId!),
    enabled: !!orgId,
  })
}
