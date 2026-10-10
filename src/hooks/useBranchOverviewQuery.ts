import { useQuery } from '@tanstack/react-query'
import { getBranchOverview } from '@/services/managerHomeService'

export function useBranchOverviewQuery(
  orgId: string | null | undefined,
  branchId: string | null | undefined,
) {
  return useQuery({
    queryKey: ['org', orgId, 'branches', branchId, 'overview'],
    queryFn: () => getBranchOverview(orgId!, branchId!),
    enabled: !!orgId && !!branchId,
  })
}
