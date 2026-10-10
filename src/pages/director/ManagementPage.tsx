import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DirectorBottomNav from '@/components/layout/DirectorBottomNav'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import BranchCard from '@/components/management/BranchCard'
import AddBranchModal from '@/components/management/AddBranchModal'
import { useBranchesQuery } from '@/hooks/useBranchesQuery'
import { useAuthStore } from '@/stores/authStore'

export default function ManagementPage() {
  const { t } = useTranslation()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const orgId = useAuthStore((s) => s.organizationId)
  const [addOpen, setAddOpen] = useState(false)
  const { data: branches, isLoading, isError, refetch } = useBranchesQuery(orgId)

  if (!token || !user) return <Navigate to="/" replace />
  if (user.role !== 'director') return <Navigate to="/home" replace />

  return (
    <>
      <AppHeader />
      <main className="management-page mx-auto max-w-sm p-3 pb-28">
        <div className="management-header mb-3 flex items-center justify-between gap-2 border-b border-[var(--color-line)] pb-2.5">
          <h2 className="text-sm font-semibold text-[var(--color-text-strong)]">
            {t('management.branches')}
          </h2>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)]"
          >
            <Plus size={16} strokeWidth={1.8} />
            {t('management.addBranch')}
          </button>
        </div>

        {isLoading ? (
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
        ) : branches && branches.length > 0 ? (
          <div className="branch-list flex flex-col gap-2">
            {branches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} orgId={orgId!} />
            ))}
          </div>
        ) : (
          <p className="text-sm font-normal text-[var(--color-text-soft)]">{t('common.empty')}</p>
        )}
      </main>
      <DirectorBottomNav />

      {addOpen && orgId && (
        <AddBranchModal orgId={orgId} onClose={() => setAddOpen(false)} />
      )}
    </>
  )
}
