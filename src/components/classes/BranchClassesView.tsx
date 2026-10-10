import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Layers, Pencil, Plus, Trash2, TriangleAlert, UserX, Users } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import BranchClassFormModal from '@/components/classes/BranchClassFormModal'
import { ApiError } from '@/services/api'
import { useBranchClassesQuery, useDeleteBranchClassMutation } from '@/hooks/useBranchClasses'
import { formatAmount, formatMonth } from '@/utils/formatMoney'
import type { BranchClass } from '@/types/branchClass'

type Props = { orgId: string; branchId: string }

/** Classes of one branch: list, create/edit (fee, teacher), delete. Used by manager and director pages. */
export default function BranchClassesView({ orgId, branchId }: Props) {
  const { t, i18n } = useTranslation()
  const { data: classes, isLoading, isError, refetch } = useBranchClassesQuery(orgId, branchId)
  const remove = useDeleteBranchClassMutation(orgId, branchId)
  const [editing, setEditing] = useState<BranchClass | 'new' | null>(null)
  const [deleting, setDeleting] = useState<BranchClass | null>(null)

  const money = (n: number) => formatAmount(n, i18n.language)
  const currency = t('payments.currency')
  const deleteError = remove.isError
    ? remove.error instanceof ApiError && remove.error.status === 409
      ? t('branchClasses.deleteBlocked')
      : t('auth.genericError')
    : null

  return (
    <>
      <div className="branch-classes flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-strong)]">
            {t('staffNav.classes')}
            {classes && <span className="ml-1.5 text-sm font-normal text-[var(--color-text-soft)] tabular-nums">{classes.length}</span>}
          </h2>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-on-primary)]"
          >
            <Plus size={16} strokeWidth={2} />
            {t('branchClasses.new')}
          </button>
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError || !classes ? (
          <Card>
            <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
            <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
          </Card>
        ) : !classes.length ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Layers size={36} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
            <p className="text-sm text-[var(--color-text-soft)]">{t('branchClasses.empty')}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {classes.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[var(--color-text-strong)]">{c.name}</p>
                  <button type="button" onClick={() => setEditing(c)} aria-label={t('branchClasses.editTitle')} title={t('branchClasses.editTitle')} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-line)] bg-transparent text-[var(--color-text-soft)] hover:bg-[var(--color-surface-hover)]">
                    <Pencil size={15} strokeWidth={1.8} />
                  </button>
                  <button type="button" onClick={() => { remove.reset(); setDeleting(c) }} aria-label={t('branchClasses.deleteTitle')} title={t('branchClasses.deleteTitle')} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-line)] bg-transparent text-[var(--color-text-soft)] hover:text-[var(--color-error-text)]">
                    <Trash2 size={15} strokeWidth={1.8} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-soft)]">
                  {c.teacher ? (
                    <span className="inline-flex items-center gap-1 text-[var(--color-text)]">
                      <GraduationCap size={13} strokeWidth={1.8} />
                      {c.teacher.name} {c.teacher.surname}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[var(--color-warning-text)]">
                      <UserX size={13} strokeWidth={1.8} />
                      {t('branchClasses.noTeacher')}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Users size={13} strokeWidth={1.8} />
                    {c.studentIds.length} {t('teacherClass.students')}
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm tabular-nums">
                  {c.currentPrice > 0 ? (
                    <span className="font-semibold text-[var(--color-text-strong)]">
                      {money(c.currentPrice)} <span className="text-xs font-normal text-[var(--color-text-soft)]">{t('branchClasses.perMonth', { currency })}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--color-warning-text)]">
                      <TriangleAlert size={12} strokeWidth={1.8} />
                      {t('branchClasses.noPrice')}
                    </span>
                  )}
                  {c.nextPrice && (
                    <span className="text-xs text-[var(--color-primary)]">
                      {t('branchClasses.nextPrice', { price: money(c.nextPrice.price), currency, month: formatMonth(c.nextPrice.effectiveFrom, i18n.language) })}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <BranchClassFormModal
          key={editing === 'new' ? 'new' : editing.id}
          orgId={orgId}
          branchId={branchId}
          cls={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDeleteModal
          title={t('branchClasses.deleteTitle')}
          warningText={t('branchClasses.deleteWarning', { name: deleting.name })}
          icon={<TriangleAlert size={48} strokeWidth={1.8} />}
          onCancel={() => setDeleting(null)}
          onConfirm={() => remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          error={deleteError}
          pending={remove.isPending}
        />
      )}
    </>
  )
}
