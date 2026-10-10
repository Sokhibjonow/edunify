import { env } from '@/config/env'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { api, ApiError, type Envelope } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { branchPaymentsSchema, paymentSchema, recordPaymentInputSchema } from '@/schemas/paymentSchemas'
import type { BranchPayments, PaymentRecord, RecordPaymentInput } from '@/types/payments'

function unwrap<T>(envelope: Envelope<T>): T {
  if (!envelope.ok) throw new ApiError(envelope.error, envelope.status)
  return envelope.data
}

function tok(): string {
  return useAuthStore.getState().token ?? ''
}

const base = (orgId: string, branchId: string) => `/orgs/${orgId}/branches/${branchId}/payments`

export async function getBranchPayments(orgId: string, branchId: string, month: string): Promise<BranchPayments> {
  if (env.useMocks) return branchPaymentsSchema.parse(unwrap(await mockApi.getBranchPayments(orgId, branchId, month, tok())))
  const res = await api.get<Envelope<unknown>>(base(orgId, branchId), { params: { month } })
  return branchPaymentsSchema.parse(unwrap(res.data))
}

export async function recordPayment(orgId: string, branchId: string, input: RecordPaymentInput): Promise<PaymentRecord> {
  const body = recordPaymentInputSchema.parse(input)
  if (env.useMocks) return paymentSchema.parse(unwrap(await mockApi.recordPayment(orgId, branchId, body, tok())))
  const res = await api.post<Envelope<unknown>>(base(orgId, branchId), body)
  return paymentSchema.parse(unwrap(res.data))
}

export async function deletePayment(orgId: string, branchId: string, paymentId: string): Promise<void> {
  if (env.useMocks) {
    unwrap(await mockApi.deletePayment(orgId, branchId, paymentId, tok()))
    return
  }
  const res = await api.delete<Envelope<unknown>>(`${base(orgId, branchId)}/${paymentId}`)
  unwrap(res.data)
}
