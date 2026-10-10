import { env } from '@/config/env'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { api, ApiError, type Envelope } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { pageSchema } from '@/schemas/branchSchemas'
import {
  branchClassSchema,
  createBranchClassInputSchema,
  updateBranchClassInputSchema,
} from '@/schemas/branchClassSchemas'
import type { BranchClass, CreateBranchClassInput, UpdateBranchClassInput } from '@/types/branchClass'

function unwrap<T>(envelope: Envelope<T>): T {
  if (!envelope.ok) throw new ApiError(envelope.error, envelope.status)
  return envelope.data
}

function tok(): string {
  return useAuthStore.getState().token ?? ''
}

const base = (orgId: string, branchId: string) => `/orgs/${orgId}/branches/${branchId}/classes`

export async function listBranchClasses(orgId: string, branchId: string): Promise<BranchClass[]> {
  const schema = pageSchema(branchClassSchema)
  if (env.useMocks) return schema.parse(unwrap(await mockApi.listBranchClasses(orgId, branchId, tok()))).items
  const res = await api.get<Envelope<unknown>>(base(orgId, branchId), { params: { page: 1, pageSize: 100 } })
  return schema.parse(unwrap(res.data)).items
}

export async function createBranchClass(orgId: string, branchId: string, input: CreateBranchClassInput): Promise<BranchClass> {
  const body = createBranchClassInputSchema.parse(input)
  if (env.useMocks) return branchClassSchema.parse(unwrap(await mockApi.createBranchClass(orgId, branchId, body, tok())))
  const res = await api.post<Envelope<unknown>>(base(orgId, branchId), body)
  return branchClassSchema.parse(unwrap(res.data))
}

export async function updateBranchClass(orgId: string, branchId: string, classId: string, input: UpdateBranchClassInput): Promise<BranchClass> {
  const body = updateBranchClassInputSchema.parse(input)
  if (env.useMocks) return branchClassSchema.parse(unwrap(await mockApi.updateBranchClass(orgId, branchId, classId, body, tok())))
  const res = await api.patch<Envelope<unknown>>(`${base(orgId, branchId)}/${classId}`, body)
  return branchClassSchema.parse(unwrap(res.data))
}

export async function deleteBranchClass(orgId: string, branchId: string, classId: string): Promise<void> {
  if (env.useMocks) {
    unwrap(await mockApi.deleteBranchClass(orgId, branchId, classId, tok()))
    return
  }
  const res = await api.delete<Envelope<unknown>>(`${base(orgId, branchId)}/${classId}`)
  unwrap(res.data)
}
