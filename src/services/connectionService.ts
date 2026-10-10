import { env } from '@/config/env'
import { api, ApiError, type Envelope } from '@/services/api'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { useAuthStore } from '@/stores/authStore'
import {
  connectionStatusResponseSchema,
  connectionRequestInputSchema,
} from '@/schemas/connectionSchemas'
import type { ConnectionStatusResponse, ConnectionRequestInput } from '@/types/connection'

function unwrap<T>(envelope: Envelope<T>): T {
  if (!envelope.ok) throw new ApiError(envelope.error, envelope.status)
  return envelope.data
}

export async function getConnectionStatus(): Promise<ConnectionStatusResponse> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.getConnectionStatus(token))
    return connectionStatusResponseSchema.parse(data)
  }
  const res = await api.get<Envelope<unknown>>('/connection/status')
  return connectionStatusResponseSchema.parse(unwrap(res.data))
}

export async function submitConnectionRequest(
  input: ConnectionRequestInput,
): Promise<ConnectionStatusResponse> {
  const body = connectionRequestInputSchema.parse(input)
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.submitConnectionRequest(token, body))
    return connectionStatusResponseSchema.parse(data)
  }
  const res = await api.post<Envelope<unknown>>('/connection/request', body)
  return connectionStatusResponseSchema.parse(unwrap(res.data))
}
