import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import DeleteManagerModal from '@/components/management/DeleteManagerModal'
import type { BranchManager } from '@/types/branch'

type Props = {
  manager: BranchManager
  orgId: string
  branchId: string
}

export default function ManagerRow({ manager, orgId, branchId }: Props) {
  const { t } = useTranslation()
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div className="manager-row flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-2.5 py-1.5">
        <span className="min-w-0 flex-1 truncate text-sm font-normal text-[var(--color-text)]">
          {manager.name} {manager.surname}
        </span>
        <span className="shrink-0 text-xs font-normal text-[var(--color-text-soft)]">
          {manager.uniqueId}
        </span>
        <button
          type="button"
          aria-label={t('management.deleteManager')}
          onClick={() => setDeleteOpen(true)}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-line)] bg-transparent p-1"
        >
          <Trash2 size={16} strokeWidth={1.8} className="text-[var(--color-text-soft)]" />
        </button>
      </div>

      {deleteOpen && (
        <DeleteManagerModal
          manager={manager}
          orgId={orgId}
          branchId={branchId}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </>
  )
}
