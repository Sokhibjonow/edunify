import { env } from '@/config/env'
import { api, ApiError, type Envelope } from '@/services/api'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { useAuthStore } from '@/stores/authStore'
import { branchOverviewSchema } from '@/schemas/managerHomeSchemas'
import type { BranchOverview } from '@/types/managerHome'

function unwrap<T>(envelope: Envelope<T>): T {
  if (!envelope.ok) throw new ApiError(envelope.error, envelope.status)
  return envelope.data
}

export async function getBranchOverview(
  orgId: string,
  branchId: string,
): Promise<BranchOverview> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.getBranchOverview(orgId, branchId, token))
    return branchOverviewSchema.parse(data)
  }
  const res = await api.get<Envelope<unknown>>(`/orgs/${orgId}/branches/${branchId}/overview`)
  return branchOverviewSchema.parse(unwrap(res.data))
}
