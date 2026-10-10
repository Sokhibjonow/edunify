import { env } from '@/config/env'
import { api, ApiError, type Envelope } from '@/services/api'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { useAuthStore } from '@/stores/authStore'
import { compressImage } from '@/utils/compressImage'
import {
  organizationSchema,
  orgLogoPatchResultSchema,
  orgThemePatchInputSchema,
  orgThemePatchResultSchema,
} from '@/schemas/orgSchemas'
import type { AuthUser } from '@/types/auth'
import type { Organization, OrgLogoPatchResult, OrgThemePatchResult } from '@/types/org'
import type { z } from 'zod'

function unwrap<T>(envelope: Envelope<T>): T {
  if (!envelope.ok) throw new ApiError(envelope.error, envelope.status)
  return envelope.data
}

export async function getOrg(orgId: string): Promise<Organization> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.getOrg(orgId, token))
    return organizationSchema.parse(data)
  }
  const res = await api.get<Envelope<unknown>>(`/orgs/${orgId}`)
  return organizationSchema.parse(unwrap(res.data))
}

export async function resolveActiveOrganization(user: AuthUser): Promise<Organization | null> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.resolveUserOrg(token))
    return data ? organizationSchema.parse(data) : null
  }
  if (user.organizationId) return getOrg(user.organizationId)
  const res = await api.get<Envelope<unknown>>('/auth/active-organization')
  const data = unwrap(res.data)
  return data ? organizationSchema.parse(data) : null
}

export async function patchOrgTheme(
  orgId: string,
  input: z.infer<typeof orgThemePatchInputSchema>,
): Promise<OrgThemePatchResult> {
  const body = orgThemePatchInputSchema.parse(input)
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.patchOrgTheme(orgId, body, token))
    return orgThemePatchResultSchema.parse(data)
  }
  const res = await api.patch<Envelope<unknown>>(`/orgs/${orgId}/theme`, body)
  return orgThemePatchResultSchema.parse(unwrap(res.data))
}

export async function patchOrgLogo(orgId: string, file: File): Promise<OrgLogoPatchResult> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.patchOrgLogo(orgId, file, token))
    return orgLogoPatchResultSchema.parse(data)
  }

  const formData = new FormData()
  formData.append('logo', await compressImage(file, 512))
  const res = await api.patch<Envelope<unknown>>(`/orgs/${orgId}/logo`, formData, {
    headers: { 'Content-Type': undefined },
  })
  return orgLogoPatchResultSchema.parse(unwrap(res.data))
}
