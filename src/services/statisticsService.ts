import { env } from '@/config/env'
import { api, ApiError, type Envelope } from '@/services/api'
import { listBranches } from '@/services/branchService'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { statisticsPeriodSchema, statisticsSnapshotSchema } from '@/schemas/statisticsSchemas'
import { useAuthStore } from '@/stores/authStore'
import { aggregateBranchStatistics } from '@/utils/aggregateBranchStatistics'
import type { StatisticsPeriod, StatisticsSnapshot } from '@/types/statistics'

function unwrap<T>(envelope: Envelope<T>): T {
  if (!envelope.ok) throw new ApiError(envelope.error, envelope.status)
  return envelope.data
}

async function fetchBranchStatistics(
  orgId: string,
  period: StatisticsPeriod,
  branchId: string,
): Promise<StatisticsSnapshot> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.getStatistics(orgId, period, token, branchId))
    return statisticsSnapshotSchema.parse(data)
  }

  const params = new URLSearchParams({
    from: period.from,
    to: period.to,
  })
  const res = await api.get<Envelope<unknown>>(
    `/orgs/${orgId}/branches/${branchId}/statistics?${params}`,
  )
  return statisticsSnapshotSchema.parse(unwrap(res.data))
}

export async function getStatistics(
  orgId: string,
  period: StatisticsPeriod,
  branchId?: string | null,
): Promise<StatisticsSnapshot> {
  const validatedPeriod = statisticsPeriodSchema.parse(period)

  if (branchId) {
    return fetchBranchStatistics(orgId, validatedPeriod, branchId)
  }

  const branches = await listBranches(orgId)
  const snapshots = await Promise.all(
    branches.map((branch) => fetchBranchStatistics(orgId, validatedPeriod, branch.id)),
  )
  return aggregateBranchStatistics(snapshots)
}
