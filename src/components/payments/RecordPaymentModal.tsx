import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { LoaderCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useRecordPaymentMutation } from '@/hooks/usePaymentMutations'
import { formatAmount, formatMonth } from '@/utils/formatMoney'
import { localDateString } from '@/utils/localDate'
import type { BillingLine } from '@/types/payments'

type Props = {
  orgId: string
  branchId: string
  month: string
  line: BillingLine
  onClose: () => void
}

const field = 'w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none'

export default function RecordPaymentModal({ orgId, branchId, month, line, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const record = useRecordPaymentMutation(orgId, branchId)
  const today = localDateString()
  const [amount, setAmount] = useState(String(line.balance || line.charge))
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')
  const value = Number(amount.replace(/\s/g, ''))
  const valid = Number.isInteger(value) && value > 0 && !!date && date <= today

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    // Midday local time keeps the chosen calendar day in any time zone
    const paidAt = date === today ? new Date().toISOString() : new Date(`${date}T12:00:00`).toISOString()
    record.mutate(
      { classId: line.classId, studentId: line.studentId, period: month, amount: value, paidAt, note: note.trim() },
      { onSuccess: onClose },
    )
  }

  const currency = t('payments.currency')

  return (
    <Modal title={t('payments.acceptTitle')} onClose={onClose} className="max-w-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
        <div className="rounded-lg bg-[var(--color-surface-hover)] px-2.5 py-2 text-sm">
          <p className="font-semibold text-[var(--color-text-strong)]">{line.studentName}</p>
          <p className="text-xs text-[var(--color-text-soft)]">{line.className} · {formatMonth(month, i18n.language)}</p>
          <p className="mt-1 text-xs text-[var(--color-text-soft)] tabular-nums">
            {t('payments.chargeLine', { charge: formatAmount(line.charge, i18n.language), paid: formatAmount(line.paid, i18n.language), currency })}
          </p>
        </div>

        <label className="flex flex-col gap-1 text-sm text-[var(--color-text)]">
          {t('payments.amount')}
          <div className="relative">
            <input
              inputMode="numeric"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d\s]/g, ''))}
              className={`${field} pr-14 tabular-nums`}
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-soft)]">{currency}</span>
          </div>
        </label>
        {value > line.balance && line.balance > 0 && (
          <p className="text-xs text-[var(--color-warning-text)]">{t('payments.moreThanBalance')}</p>
        )}

        <label className="flex flex-col gap-1 text-sm text-[var(--color-text)]">
          {t('payments.paidOn')}
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>

        <label className="flex flex-col gap-1 text-sm text-[var(--color-text)]">
          {t('payments.note')}
          <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder={t('payments.notePlaceholder')} className={`${field} placeholder:text-[var(--color-text-soft)]`} />
        </label>

        {record.isError && <p className="text-sm text-[var(--color-error-text)]">{t('payments.saveError')}</p>}

        <div className="mt-1 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent py-1.5 text-sm text-[var(--color-text)]">
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={!valid || record.isPending}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] py-1.5 text-sm font-semibold text-[var(--color-on-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {record.isPending && <LoaderCircle size={15} strokeWidth={1.8} className="animate-spin" />}
            {t('payments.accept')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
