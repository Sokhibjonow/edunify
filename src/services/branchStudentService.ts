import { env } from '@/config/env'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { api, ApiError, type Envelope } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { studentSummarySchema } from '@/schemas/teacherClassSchemas'
import {
  branchStudentSchema,
  branchStudentLookupSchema,
  enrollBranchStudentInputSchema,
} from '@/schemas/branchStudentSchemas'
import type { BranchStudent, BranchStudentLookup, EnrollBranchStudentInput } from '@/types/branchStudent'
import type { StudentSummary } from '@/types/teacherClass'

function unwrap<T>(envelope: Envelope<T>): T {
  if (!envelope.ok) throw new ApiError(envelope.error, envelope.status)
  return envelope.data
}

function tok(): string {
  return useAuthStore.getState().token ?? ''
}

const base = (orgId: string, branchId: string) => `/orgs/${orgId}/branches/${branchId}/students`

export async function listBranchStudents(orgId: string, branchId: string): Promise<BranchStudent[]> {
  const schema = branchStudentSchema.array()
  if (env.useMocks) return schema.parse(unwrap(await mockApi.listBranchStudents(orgId, branchId, tok())))
  const res = await api.get<Envelope<unknown>>(base(orgId, branchId))
  return schema.parse(unwrap(res.data))
}

export async function lookupBranchStudent(orgId: string, branchId: string, uniqueId: string): Promise<BranchStudentLookup> {
  if (env.useMocks) return branchStudentLookupSchema.parse(unwrap(await mockApi.lookupBranchStudent(orgId, branchId, uniqueId, tok())))
  const res = await api.get<Envelope<unknown>>(`${base(orgId, branchId)}/lookup`, { params: { uniqueId } })
  return branchStudentLookupSchema.parse(unwrap(res.data))
}

export async function enrollBranchStudent(orgId: string, branchId: string, input: EnrollBranchStudentInput): Promise<StudentSummary> {
  const body = enrollBranchStudentInputSchema.parse(input)
  if (env.useMocks) return studentSummarySchema.parse(unwrap(await mockApi.enrollBranchStudent(orgId, branchId, body, tok())))
  const res = await api.post<Envelope<unknown>>(`${base(orgId, branchId)}/enroll`, body)
  return studentSummarySchema.parse(unwrap(res.data))
}
