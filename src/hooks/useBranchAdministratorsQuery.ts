import { useQuery } from '@tanstack/react-query'
import { listBranchAdministrators } from '@/services/branchService'

export function useBranchAdministratorsQuery(
  orgId: string | null | undefined,
  branchId: string | null | undefined,
) {
  return useQuery({
    queryKey: ['branchAdministrators', orgId, branchId],
    queryFn: () => listBranchAdministrators(orgId!, branchId!),
    enabled: !!orgId && !!branchId,
  })
}
