import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { deletePayment, recordPayment } from '@/services/paymentService'
import type { RecordPaymentInput } from '@/types/payments'

/** Payments feed the payments page, the manager home (debtors) and statistics (revenue). */
function invalidateMoney(queryClient: QueryClient, orgId: string, branchId: string) {
  queryClient.invalidateQueries({ queryKey: ['org', orgId, 'branches', branchId] })
  queryClient.invalidateQueries({ queryKey: ['statistics', orgId] })
}

export function useRecordPaymentMutation(orgId: string, branchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => recordPayment(orgId, branchId, input),
    onSuccess: () => invalidateMoney(queryClient, orgId, branchId),
  })
}

export function useDeletePaymentMutation(orgId: string, branchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (paymentId: string) => deletePayment(orgId, branchId, paymentId),
    onSuccess: () => invalidateMoney(queryClient, orgId, branchId),
  })
}
