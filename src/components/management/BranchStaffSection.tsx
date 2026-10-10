import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import BranchStaffRow from '@/components/management/BranchStaffRow'

type Role = 'administrator' | 'teacher'
type Member = { uniqueId: string; name: string; surname: string }

type Props = {
  role: Role
  title: string
  addLabel: string
  onAdd: () => void
  items: Member[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  orgId: string
  branchId: string
  className: string
}

export default function BranchStaffSection({
  role,
  title,
  addLabel,
  onAdd,
  items,
  isLoading,
  isError,
  onRetry,
  orgId,
  branchId,
  className,
}: Props) {
  const { t } = useTranslation()

  return (
    <section className={`${className} flex flex-col gap-2`}>
      <div className="branch-staff-header flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-strong)]">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[var(--color-line)] bg-transparent px-2 py-1 text-xs font-normal text-[var(--color-text)]"
        >
          <Plus size={14} strokeWidth={1.8} />
          {addLabel}
        </button>
      </div>

      <div className="branch-staff-list flex flex-col gap-1.5">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <div>
            <p className="text-sm font-normal text-[var(--color-error-text)]">
              {t('common.loadError')}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)]"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : items && items.length > 0 ? (
          items.map((member) => (
            <BranchStaffRow
              key={member.uniqueId}
              role={role}
              member={member}
              orgId={orgId}
              branchId={branchId}
            />
          ))
        ) : (
          <p className="text-sm font-normal text-[var(--color-text-soft)]">{t('common.empty')}</p>
        )}
      </div>
    </section>
  )
}
