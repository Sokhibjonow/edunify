import { useQuery } from '@tanstack/react-query'
import { listBranchTeachers } from '@/services/branchService'

export function useBranchTeachersQuery(
  orgId: string | null | undefined,
  branchId: string | null | undefined,
) {
  return useQuery({
    queryKey: ['branchTeachers', orgId, branchId],
    queryFn: () => listBranchTeachers(orgId!, branchId!),
    enabled: !!orgId && !!branchId,
  })
}
