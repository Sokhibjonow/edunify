import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { getStatistics } from '@/services/statisticsService'
import type { StatisticsPeriod, StatisticsSnapshot } from '@/types/statistics'

type Options = Pick<UseQueryOptions<StatisticsSnapshot>, 'enabled'>

export function useStatisticsQuery(
  orgId: string | null | undefined,
  period: StatisticsPeriod,
  branchId?: string | null,
  options?: Options,
) {
  return useQuery({
    queryKey: ['statistics', orgId, branchId ?? 'overall', period.from, period.to],
    queryFn: () => getStatistics(orgId!, period, branchId),
    enabled: !!orgId && !!period.from && !!period.to && (options?.enabled ?? true),
  })
}
