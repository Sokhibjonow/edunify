import { useQuery } from '@tanstack/react-query'
import { getBranchPayments } from '@/services/paymentService'

export function useBranchPaymentsQuery(
  orgId: string | null | undefined,
  branchId: string | null | undefined,
  month: string,
) {
  return useQuery({
    queryKey: ['org', orgId, 'branches', branchId, 'payments', month],
    queryFn: () => getBranchPayments(orgId!, branchId!, month),
    enabled: !!orgId && !!branchId,
  })
}
