import { env } from '@/config/env'
import { api, ApiError, type Envelope } from '@/services/api'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { useAuthStore } from '@/stores/authStore'
import {
  profileSchema,
  profilePatchInputSchema,
  changePasswordInputSchema,
  changePasswordResultSchema,
} from '@/schemas/profileSchemas'
import type { Profile, ProfilePatchInput, ChangePasswordInput, ChangePasswordResult } from '@/types/profile'

function unwrap<T>(envelope: Envelope<T>): T {
  if (!envelope.ok) throw new ApiError(envelope.error, envelope.status)
  return envelope.data
}

export async function getProfile(): Promise<Profile> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.getProfile(token))
    return profileSchema.parse(data)
  }
  const res = await api.get<Envelope<unknown>>('/profile')
  return profileSchema.parse(unwrap(res.data))
}

export async function patchProfile(input: ProfilePatchInput): Promise<Profile> {
  const body = profilePatchInputSchema.parse(input)
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.patchProfile(token, body))
    return profileSchema.parse(data)
  }
  const res = await api.patch<Envelope<unknown>>('/profile', body)
  return profileSchema.parse(unwrap(res.data))
}

export async function patchPassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
  const body = changePasswordInputSchema.parse(input)
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.patchPassword(token, body))
    return changePasswordResultSchema.parse(data)
  }
  const res = await api.patch<Envelope<unknown>>('/profile/password', body)
  return changePasswordResultSchema.parse(unwrap(res.data))
}
