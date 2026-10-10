import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import AppHeader from '@/components/layout/AppHeader'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import StatisticsCard from '@/components/home/StatisticsCard'
import { useBranchesQuery } from '@/hooks/useBranchesQuery'
import { useBranchStudentCountsQuery } from '@/hooks/useBranchStudentCountsQuery'
import { useAuthStore } from '@/stores/authStore'

export default function HomeOverview() {
  const { t } = useTranslation()
  const orgId = useAuthStore((s) => s.organizationId)
  const { data: branches, isLoading, isError, refetch } = useBranchesQuery(orgId)
  const { data: studentCounts, isLoading: countsLoading } = useBranchStudentCountsQuery(orgId)

  const branchesWithStudents = useMemo(() => {
    if (!branches || !studentCounts) return []
    return branches.filter((branch) => (studentCounts[branch.id] ?? 0) > 0)
  }, [branches, studentCounts])

  const loading = isLoading || countsLoading

  return (
    <>
      <AppHeader />
      <main className="home-page mx-auto max-w-md p-3 pb-28 sm:p-4 sm:pb-28">
        {loading ? (
          <Spinner />
        ) : isError ? (
          <Card>
            <p className="text-sm font-normal text-[var(--color-error-text)]">{t('common.loadError')}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)]"
            >
              {t('common.retry')}
            </button>
          </Card>
        ) : (
          <div className="home-overview-section flex flex-col gap-2.5">
            <StatisticsCard title={t('home.overall')} orgId={orgId!} />

            {branchesWithStudents.map((branch) => (
              <StatisticsCard
                key={branch.id}
                title={branch.name}
                orgId={orgId!}
                branchId={branch.id}
                collapsible
                defaultExpanded={false}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
