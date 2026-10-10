import { useTranslation } from 'react-i18next'
import { LoaderCircle, UserMinus } from 'lucide-react'
import { useRemoveClassStudentMutation } from '@/hooks/useRemoveClassStudentMutation'
import { formatMonth } from '@/utils/formatMoney'
import type { RemoveStudentResult } from '@/types/teacherClass'

type Props = {
  classId: string
  className: string
  studentId: string
  studentName: string
  onCancel: () => void
  onRemoved: (message: string) => void
}

/** Inline "remove from class?" step. Used by the teacher's roster and the staff student card. */
export default function RemoveStudentConfirm({ classId, className, studentId, studentName, onCancel, onRemoved }: Props) {
  const { t, i18n } = useTranslation()
  const remove = useRemoveClassStudentMutation()

  function done(r: RemoveStudentResult) {
    onRemoved(r.undone || !r.lastBilledPeriod
      ? t('removeStudent.undone', { name: studentName })
      : t('removeStudent.done', { name: studentName, month: formatMonth(r.lastBilledPeriod, i18n.language) }))
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-error)] bg-[var(--color-error-soft)] p-2.5">
      <p className="text-sm font-semibold text-[var(--color-text-strong)]">{t('removeStudent.question', { name: studentName, className })}</p>
      <p className="text-xs text-[var(--color-text)]">{t('removeStudent.hint')}</p>
      {remove.isError && <p className="text-xs text-[var(--color-error-text)]">{t('auth.genericError')}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1 text-sm text-[var(--color-text)]"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          disabled={remove.isPending}
          onClick={() => remove.mutate({ classId, studentId }, { onSuccess: done })}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-[var(--color-error)] px-2.5 py-1 text-sm font-semibold text-[var(--color-on-primary)] disabled:opacity-50"
        >
          {remove.isPending ? <LoaderCircle size={15} strokeWidth={1.8} className="animate-spin" /> : <UserMinus size={15} strokeWidth={1.8} />}
          {t('removeStudent.remove')}
        </button>
      </div>
    </div>
  )
}
