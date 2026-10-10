import { useQuery } from '@tanstack/react-query'
import { listBranchManagers } from '@/services/branchService'

export function useBranchManagersQuery(
  orgId: string | null | undefined,
  branchId: string,
) {
  return useQuery({
    queryKey: ['branchManagers', orgId, branchId],
    queryFn: () => listBranchManagers(orgId!, branchId),
    enabled: !!orgId && !!branchId,
  })
}
