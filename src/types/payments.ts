import type { z } from 'zod'
import type {
  billingStatusSchema,
  billingLineSchema,
  branchPaymentsSchema,
  paymentSchema,
  recordPaymentInputSchema,
} from '@/schemas/paymentSchemas'

export type BillingStatus = z.infer<typeof billingStatusSchema>
export type BillingLine = z.infer<typeof billingLineSchema>
export type BranchPayments = z.infer<typeof branchPaymentsSchema>
export type PaymentRecord = z.infer<typeof paymentSchema>
export type RecordPaymentInput = z.infer<typeof recordPaymentInputSchema>
