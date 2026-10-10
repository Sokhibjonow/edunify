import { env } from '@/config/env'
import { api, ApiError, type Envelope } from '@/services/api'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { useAuthStore } from '@/stores/authStore'
import { z } from 'zod'
import { branchManagerSchema, branchAdministratorSchema, branchTeacherSchema, branchSchema, createBranchInputSchema, updateBranchInputSchema, assignBranchManagerInputSchema, assignBranchAdministratorInputSchema, assignBranchTeacherInputSchema, pageSchema } from '@/schemas/branchSchemas'
import type { AssignBranchManagerInput, AssignBranchAdministratorInput, AssignBranchTeacherInput, Branch, BranchManager, BranchAdministrator, BranchTeacher, CreateBranchInput, UpdateBranchInput } from '@/types/branch'

const branchStudentCountsSchema = z.record(z.string(), z.number())

function unwrap<T>(envelope: Envelope<T>): T {
  if (!envelope.ok) throw new ApiError(envelope.error, envelope.status)
  return envelope.data
}

export async function listBranches(orgId: string): Promise<Branch[]> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.listBranches(orgId, token))
    return pageSchema(branchSchema).parse(data).items
  }
  const res = await api.get<Envelope<unknown>>(`/orgs/${orgId}/branches`)
  return pageSchema(branchSchema).parse(unwrap(res.data)).items
}

export async function getBranchStudentCounts(orgId: string): Promise<Record<string, number>> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.getBranchStudentCounts(orgId, token))
    return branchStudentCountsSchema.parse(data)
  }
  const res = await api.get<Envelope<unknown>>(`/orgs/${orgId}/branches/student-counts`)
  return branchStudentCountsSchema.parse(unwrap(res.data))
}

export async function listBranchManagers(orgId: string, branchId: string): Promise<BranchManager[]> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.listBranchManagers(orgId, branchId, token))
    return pageSchema(branchManagerSchema).parse(data).items
  }
  const res = await api.get<Envelope<unknown>>(`/orgs/${orgId}/branches/${branchId}/managers`)
  return pageSchema(branchManagerSchema).parse(unwrap(res.data)).items
}

export async function createBranch(orgId: string, input: CreateBranchInput): Promise<Branch> {
  const body = createBranchInputSchema.parse(input)
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.createBranch(orgId, body, token))
    return branchSchema.parse(data)
  }
  const res = await api.post<Envelope<unknown>>(`/orgs/${orgId}/branches`, body)
  return branchSchema.parse(unwrap(res.data))
}

export async function deleteBranch(orgId: string, branchId: string): Promise<void> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    unwrap(await mockApi.deleteBranch(orgId, branchId, token))
    return
  }
  const res = await api.delete<Envelope<unknown>>(`/orgs/${orgId}/branches/${branchId}`)
  unwrap(res.data)
}

export async function updateBranch(
  orgId: string,
  branchId: string,
  input: UpdateBranchInput,
): Promise<Branch> {
  const body = updateBranchInputSchema.parse(input)
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.updateBranch(orgId, branchId, body, token))
    return branchSchema.parse(data)
  }
  const res = await api.patch<Envelope<unknown>>(`/orgs/${orgId}/branches/${branchId}`, body)
  return branchSchema.parse(unwrap(res.data))
}

export async function assignBranchManager(
  orgId: string,
  branchId: string,
  input: AssignBranchManagerInput,
): Promise<BranchManager> {
  const body = assignBranchManagerInputSchema.parse(input)
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.assignBranchManager(orgId, branchId, body, token))
    return branchManagerSchema.parse(data)
  }
  const res = await api.post<Envelope<unknown>>(
    `/orgs/${orgId}/branches/${branchId}/managers`,
    body,
  )
  return branchManagerSchema.parse(unwrap(res.data))
}

export async function removeBranchManager(
  orgId: string,
  branchId: string,
  managerId: string,
): Promise<void> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    unwrap(await mockApi.removeBranchManager(orgId, branchId, managerId, token))
    return
  }
  const res = await api.delete<Envelope<unknown>>(
    `/orgs/${orgId}/branches/${branchId}/managers/${managerId}`,
  )
  unwrap(res.data)
}

export async function listBranchAdministrators(
  orgId: string,
  branchId: string,
): Promise<BranchAdministrator[]> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.listBranchAdministrators(orgId, branchId, token))
    return pageSchema(branchAdministratorSchema).parse(data).items
  }
  const res = await api.get<Envelope<unknown>>(`/orgs/${orgId}/branches/${branchId}/administrators`)
  return pageSchema(branchAdministratorSchema).parse(unwrap(res.data)).items
}

export async function listBranchTeachers(
  orgId: string,
  branchId: string,
): Promise<BranchTeacher[]> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.listBranchTeachers(orgId, branchId, token))
    return pageSchema(branchTeacherSchema).parse(data).items
  }
  const res = await api.get<Envelope<unknown>>(`/orgs/${orgId}/branches/${branchId}/teachers`)
  return pageSchema(branchTeacherSchema).parse(unwrap(res.data)).items
}

export async function assignBranchAdministrator(
  orgId: string,
  branchId: string,
  input: AssignBranchAdministratorInput,
): Promise<BranchAdministrator> {
  const body = assignBranchAdministratorInputSchema.parse(input)
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.assignBranchAdministrator(orgId, branchId, body, token))
    return branchAdministratorSchema.parse(data)
  }
  const res = await api.post<Envelope<unknown>>(
    `/orgs/${orgId}/branches/${branchId}/administrators`,
    body,
  )
  return branchAdministratorSchema.parse(unwrap(res.data))
}

export async function assignBranchTeacher(
  orgId: string,
  branchId: string,
  input: AssignBranchTeacherInput,
): Promise<BranchTeacher> {
  const body = assignBranchTeacherInputSchema.parse(input)
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.assignBranchTeacher(orgId, branchId, body, token))
    return branchTeacherSchema.parse(data)
  }
  const res = await api.post<Envelope<unknown>>(
    `/orgs/${orgId}/branches/${branchId}/teachers`,
    body,
  )
  return branchTeacherSchema.parse(unwrap(res.data))
}

export async function removeBranchAdministrator(
  orgId: string,
  branchId: string,
  administratorId: string,
): Promise<void> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    unwrap(await mockApi.removeBranchAdministrator(orgId, branchId, administratorId, token))
    return
  }
  const res = await api.delete<Envelope<unknown>>(
    `/orgs/${orgId}/branches/${branchId}/administrators/${administratorId}`,
  )
  unwrap(res.data)
}

export async function removeBranchTeacher(
  orgId: string,
  branchId: string,
  teacherId: string,
): Promise<void> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    unwrap(await mockApi.removeBranchTeacher(orgId, branchId, teacherId, token))
    return
  }
  const res = await api.delete<Envelope<unknown>>(
    `/orgs/${orgId}/branches/${branchId}/teachers/${teacherId}`,
  )
  unwrap(res.data)
}
