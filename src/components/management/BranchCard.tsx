import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GitBranch, Copy, Plus } from 'lucide-react'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import ManagerRow from '@/components/management/ManagerRow'
import BranchActionsMenu from '@/components/management/BranchActionsMenu'
import DeleteBranchModal from '@/components/management/DeleteBranchModal'
import EditBranchNameModal from '@/components/management/EditBranchNameModal'
import AddManagerModal from '@/components/management/AddManagerModal'
import { useBranchManagersQuery } from '@/hooks/useBranchManagersQuery'
import type { Branch } from '@/types/branch'

type Props = { branch: Branch; orgId: string }

const actionBtnClass =
  'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[var(--color-line)] bg-transparent px-2 py-1 text-xs font-normal text-[var(--color-text)]'

export default function BranchCard({ branch, orgId }: Props) {
  const { t } = useTranslation()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [addManagerOpen, setAddManagerOpen] = useState(false)
  const { data: managers, isLoading } = useBranchManagersQuery(orgId, branch.id)

  const copyBranchId = () => {
    void navigator.clipboard.writeText(branch.id)
  }

  return (
    <>
      <Card className="branch-card flex flex-col gap-2 p-3">
        <div className="branch-header flex items-center gap-2">
          <GitBranch size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-strong)]" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-text-strong)]">
            {branch.name}
          </span>
          <button
            type="button"
            onClick={copyBranchId}
            aria-label={t('management.copyBranchId')}
            className="inline-flex max-w-[148px] shrink-0 cursor-pointer items-center gap-1 rounded-lg border-0 bg-transparent p-0 text-xs font-normal text-[var(--color-text-strong)]"
          >
            <span className="truncate">
              {t('management.id')}: {branch.id}
            </span>
            <Copy size={18} strokeWidth={1.8} className="shrink-0" />
          </button>
          <BranchActionsMenu
            onEditName={() => setEditOpen(true)}
            onDeleteBranch={() => setDeleteOpen(true)}
          />
        </div>

        <div className="branch-managers-section flex items-center justify-between gap-2">
          <span className="text-sm font-normal text-[var(--color-text-soft)]">
            {t('management.managers')}
          </span>
          <button type="button" onClick={() => setAddManagerOpen(true)} className={actionBtnClass}>
            <Plus size={14} strokeWidth={1.8} />
            {t('management.addManager')}
          </button>
        </div>

        <div className="branch-managers-list flex flex-col gap-1.5">
          {isLoading ? (
            <Spinner />
          ) : managers && managers.length > 0 ? (
            managers.map((manager) => (
              <ManagerRow
                key={manager.uniqueId}
                manager={manager}
                orgId={orgId}
                branchId={branch.id}
              />
            ))
          ) : (
            <p className="text-sm font-normal text-[var(--color-text-soft)]">{t('common.empty')}</p>
          )}
        </div>
      </Card>

      {editOpen && (
        <EditBranchNameModal
          branch={branch}
          orgId={orgId}
          onClose={() => setEditOpen(false)}
        />
      )}

      {deleteOpen && (
        <DeleteBranchModal
          branch={branch}
          orgId={orgId}
          onClose={() => setDeleteOpen(false)}
        />
      )}

      {addManagerOpen && (
        <AddManagerModal
          orgId={orgId}
          branchId={branch.id}
          onClose={() => setAddManagerOpen(false)}
        />
      )}
    </>
  )
}
