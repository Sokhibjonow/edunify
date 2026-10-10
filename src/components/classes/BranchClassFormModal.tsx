import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Info, LoaderCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useBranchTeachersQuery } from '@/hooks/useBranchTeachersQuery'
import { useCreateBranchClassMutation, useUpdateBranchClassMutation } from '@/hooks/useBranchClasses'
import { formatMonth, shiftMonth } from '@/utils/formatMoney'
import { localDateString } from '@/utils/localDate'
import type { BranchClass } from '@/types/branchClass'

type Props = {
  orgId: string
  branchId: string
  /** Edit this class; omit to create a new one. */
  cls?: BranchClass
  onClose: () => void
}

const field = 'w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:outline-none'

export default function BranchClassFormModal({ orgId, branchId, cls, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const teachers = useBranchTeachersQuery(orgId, branchId)
  const create = useCreateBranchClassMutation(orgId, branchId)
  const update = useUpdateBranchClassMutation(orgId, branchId)
  const mutation = cls ? update : create

  const thisMonth = localDateString().slice(0, 7)
  const nextMonth = shiftMonth(thisMonth, 1)
  const latestPrice = cls ? (cls.nextPrice?.price ?? cls.currentPrice) : 0
  const [name, setName] = useState(cls?.name ?? '')
  const [price, setPrice] = useState(cls ? String(latestPrice) : '')
  const [teacherId, setTeacherId] = useState(cls?.teacherId ?? '')
  const [effectiveFrom, setEffectiveFrom] = useState(cls && cls.currentPrice > 0 ? nextMonth : thisMonth)

  const amount = price.trim() === '' ? 0 : Number(price.replace(/\s/g, ''))
  const validPrice = Number.isInteger(amount) && amount >= 0
  const valid = name.trim().length > 0 && validPrice
  const priceChanged = !!cls && validPrice && amount !== latestPrice
  const teacherChanged = !!cls && (teacherId || null) !== cls.teacherId
  const previousTeacher = cls?.teacher ? `${cls.teacher.name} ${cls.teacher.surname}` : null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    if (!cls) {
      create.mutate({ name: name.trim(), classPrice: amount, teacherId: teacherId || null }, { onSuccess: onClose })
      return
    }
    update.mutate(
      {
        classId: cls.id,
        ...(name.trim() !== cls.name ? { name: name.trim() } : {}),
        ...(teacherChanged ? { teacherId: teacherId || null } : {}),
        ...(priceChanged ? { price: { amount, effectiveFrom } } : {}),
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal title={cls ? t('branchClasses.editTitle') : t('branchClasses.createTitle')} onClose={onClose} className="max-w-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
        <label className="flex flex-col gap-1 text-sm text-[var(--color-text)]">
          {t('branchClasses.name')}
          <input autoFocus value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder={t('teacherClass.classNamePlaceholder')} className={field} />
        </label>

        <label className="flex flex-col gap-1 text-sm text-[var(--color-text)]">
          {t('branchClasses.pricePerMonth')}
          <div className="relative">
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d\s]/g, ''))}
              placeholder="0"
              className={`${field} pr-14 tabular-nums`}
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-soft)]">{t('payments.currency')}</span>
          </div>
        </label>
        {!cls && amount === 0 && <p className="text-xs text-[var(--color-text-soft)]">{t('branchClasses.freeHint')}</p>}

        {priceChanged && (
          <label className="flex flex-col gap-1 text-sm text-[var(--color-text)]">
            {t('branchClasses.appliesFrom')}
            <select value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className={`${field} capitalize`}>
              <option value={thisMonth}>{formatMonth(thisMonth, i18n.language)}</option>
              <option value={nextMonth}>{formatMonth(nextMonth, i18n.language)}</option>
            </select>
            <span className="text-xs text-[var(--color-text-soft)]">{t('branchClasses.pastMonthsKeep')}</span>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm text-[var(--color-text)]">
          {t('branchClasses.teacher')}
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={field} disabled={teachers.isLoading}>
            <option value="">{t('branchClasses.noTeacherOption')}</option>
            {(teachers.data ?? []).map((tc) => (
              <option key={tc.uniqueId} value={tc.uniqueId}>{tc.name} {tc.surname}</option>
            ))}
          </select>
        </label>
        {teacherChanged && previousTeacher && (
          <p className="inline-flex items-start gap-1.5 text-xs text-[var(--color-warning-text)]">
            <Info size={13} strokeWidth={1.8} className="mt-px shrink-0" />
            {t('branchClasses.teacherChangeWarning', { name: previousTeacher })}
          </p>
        )}

        {mutation.isError && <p className="text-sm text-[var(--color-error-text)]">{t('branchClasses.saveError')}</p>}

        <div className="mt-1 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent py-1.5 text-sm text-[var(--color-text)]">
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={!valid || mutation.isPending}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] py-1.5 text-sm font-semibold text-[var(--color-on-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending && <LoaderCircle size={15} strokeWidth={1.8} className="animate-spin" />}
            {cls ? t('branchClasses.save') : t('branchClasses.create')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
