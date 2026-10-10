import { env } from '@/config/env'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { api, ApiError, type Envelope } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import {
  childOverviewSchema,
  linkParentInputSchema,
  parentChildSchema,
  parentLookupSchema,
  studentParentSchema,
} from '@/schemas/parentSchemas'
import type { ChildOverview, ParentChild, ParentLookup, StudentParent } from '@/types/parent'

function unwrap<T>(envelope: Envelope<T>): T {
  if (!envelope.ok) throw new ApiError(envelope.error, envelope.status)
  return envelope.data
}

function tok(): string {
  return useAuthStore.getState().token ?? ''
}

// ── Parent side ──────────────────────────────────────────────

export async function listParentChildren(parentId: string): Promise<ParentChild[]> {
  const schema = parentChildSchema.array()
  if (env.useMocks) return schema.parse(unwrap(await mockApi.listParentChildren(parentId, tok())))
  const res = await api.get<Envelope<unknown>>(`/parents/${parentId}/children`)
  return schema.parse(unwrap(res.data))
}

export async function getChildOverview(parentId: string, studentId: string): Promise<ChildOverview> {
  if (env.useMocks) return childOverviewSchema.parse(unwrap(await mockApi.getChildOverview(parentId, studentId, tok())))
  const res = await api.get<Envelope<unknown>>(`/parents/${parentId}/children/${studentId}`)
  return childOverviewSchema.parse(unwrap(res.data))
}

// ── Staff side: who may see a student ────────────────────────

const branchBase = (orgId: string, branchId: string) => `/orgs/${orgId}/branches/${branchId}`

export async function listStudentParents(orgId: string, branchId: string, studentId: string): Promise<StudentParent[]> {
  const schema = studentParentSchema.array()
  if (env.useMocks) return schema.parse(unwrap(await mockApi.listStudentParents(orgId, branchId, studentId, tok())))
  const res = await api.get<Envelope<unknown>>(`${branchBase(orgId, branchId)}/students/${studentId}/parents`)
  return schema.parse(unwrap(res.data))
}

export async function lookupParent(orgId: string, branchId: string, uniqueId: string): Promise<ParentLookup> {
  if (env.useMocks) return parentLookupSchema.parse(unwrap(await mockApi.lookupParent(orgId, branchId, uniqueId, tok())))
  const res = await api.get<Envelope<unknown>>(`${branchBase(orgId, branchId)}/parents/lookup`, { params: { uniqueId } })
  return parentLookupSchema.parse(unwrap(res.data))
}

export async function linkParent(orgId: string, branchId: string, studentId: string, parentId: string): Promise<StudentParent> {
  const body = linkParentInputSchema.parse({ parentId })
  if (env.useMocks) return studentParentSchema.parse(unwrap(await mockApi.linkParent(orgId, branchId, studentId, body.parentId, tok())))
  const res = await api.post<Envelope<unknown>>(`${branchBase(orgId, branchId)}/students/${studentId}/parents`, body)
  return studentParentSchema.parse(unwrap(res.data))
}

export async function unlinkParent(orgId: string, branchId: string, studentId: string, parentId: string): Promise<void> {
  if (env.useMocks) {
    unwrap(await mockApi.unlinkParent(orgId, branchId, studentId, parentId, tok()))
    return
  }
  const res = await api.delete<Envelope<unknown>>(`${branchBase(orgId, branchId)}/students/${studentId}/parents/${parentId}`)
  unwrap(res.data)
}
