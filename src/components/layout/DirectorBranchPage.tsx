import type { ReactNode } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GitBranch } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DirectorBottomNav from '@/components/layout/DirectorBottomNav'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import { useAuthStore } from '@/stores/authStore'
import { useBranchesQuery } from '@/hooks/useBranchesQuery'

type Props = {
  /** Renders the branch-scoped content; remounts when the branch changes. */
  children: (orgId: string, branchId: string) => ReactNode
}

/**
 * Director layout for branch-scoped pages (payments, classes, students): a branch picker
 * kept in `?branch=`, so reloads and links between pages stay on the same branch.
 */
export default function DirectorBranchPage({ children }: Props) {
  const { t } = useTranslation()
  const orgId = useAuthStore((s) => s.organizationId)
  const { data: branches, isLoading, isError, refetch } = useBranchesQuery(orgId)
  const [params, setParams] = useSearchParams()
  const requested = params.get('branch')
  const branchId = branches?.some((b) => b.id === requested) ? requested! : branches?.[0]?.id ?? null

  return (
    <>
      <AppHeader />
      <main className="director-branch-page mx-auto flex max-w-md flex-col gap-3 p-3 pb-28">
        {isLoading ? (
          <Spinner />
        ) : isError || !orgId ? (
          <Card>
            <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
            <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
          </Card>
        ) : !branches?.length || !branchId ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <GitBranch size={36} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
            <p className="text-sm text-[var(--color-text-soft)]">{t('directorBranch.noBranches')}</p>
            <Link to="/management" className="text-sm font-semibold text-[var(--color-primary)]">{t('directorBranch.toManagement')}</Link>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] px-2.5 py-1.5">
              <GitBranch size={16} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-soft)]" />
              <span className="shrink-0 text-xs text-[var(--color-text-soft)]">{t('directorBranch.branch')}</span>
              <select
                value={branchId}
                onChange={(e) => setParams({ branch: e.target.value }, { replace: true })}
                className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-sm font-semibold text-[var(--color-text-strong)] focus:outline-none"
              >
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <div key={branchId}>{children(orgId, branchId)}</div>
          </>
        )}
      </main>
      <DirectorBottomNav />
    </>
  )
}
