import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Trash2, Wallet } from 'lucide-react'
import { formatAmount } from '@/utils/formatMoney'
import { formatDayMonth } from '@/utils/formatDate'
import type { BillingLine, BillingStatus } from '@/types/payments'

const BADGE: Record<BillingStatus, string> = {
  paid: 'text-[var(--color-success-text)] bg-[var(--color-success-soft)]',
  partial: 'text-[var(--color-primary)] bg-[var(--color-accent-soft)]',
  due: 'text-[var(--color-text)] bg-[var(--color-surface-hover)]',
  overdue: 'text-[var(--color-error-text)] bg-[var(--color-error-soft)]',
}

type Props = {
  line: BillingLine
  onAccept: () => void
  onUndo: (paymentId: string, amount: number) => void
}

export default function PaymentLineRow({ line, onAccept, onUndo }: Props) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const money = (n: number) => formatAmount(n, i18n.language)
  const currency = t('payments.currency')
  const day = (date: string) => formatDayMonth(date.length === 10 ? `${date}T12:00:00` : date)

  const detail =
    line.status === 'paid'
      ? t('payments.paidOnDay', { date: line.lastPaidAt ? day(line.lastPaidAt) : '' })
      : line.status === 'partial'
        ? t('payments.partialOf', { paid: money(line.paid), charge: money(line.charge) })
        : line.status === 'overdue'
          ? t('payments.overdueSince', { date: day(line.dueDate) })
          : t('payments.dueBy', { date: day(line.dueDate) })

  return (
    <li className="flex flex-col gap-2 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--color-text-strong)]">{line.studentName}</p>
          <p className="truncate text-xs text-[var(--color-text-soft)]">{line.className}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-[var(--color-text-strong)] tabular-nums">
            {money(line.status === 'paid' ? line.paid : line.balance)} <span className="text-xs font-normal text-[var(--color-text-soft)]">{currency}</span>
          </p>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE[line.status]}`}>{detail}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {line.payments.length ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
          >
            {open ? <ChevronUp size={13} strokeWidth={1.8} /> : <ChevronDown size={13} strokeWidth={1.8} />}
            {t('payments.history', { n: line.payments.length })}
          </button>
        ) : <span />}
        {line.status !== 'paid' && (
          <button
            type="button"
            onClick={onAccept}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-2.5 py-1 text-xs font-semibold text-[var(--color-on-primary)]"
          >
            <Wallet size={14} strokeWidth={1.8} />
            {t('payments.accept')}
          </button>
        )}
      </div>

      {open && (
        <ul className="flex flex-col gap-1 rounded-lg bg-[var(--color-surface-hover)] p-2">
          {line.payments.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-xs">
              <span className="w-12 shrink-0 text-[var(--color-text-soft)] tabular-nums">{day(p.paidAt)}</span>
              <span className="font-semibold text-[var(--color-text-strong)] tabular-nums">{money(p.amount)} {currency}</span>
              <span className="min-w-0 flex-1 truncate text-[var(--color-text-soft)]">{p.note}</span>
              <button
                type="button"
                onClick={() => onUndo(p.id, p.amount)}
                aria-label={t('payments.undo')}
                title={t('payments.undo')}
                className="shrink-0 cursor-pointer border-0 bg-transparent p-0.5 text-[var(--color-text-soft)] hover:text-[var(--color-error-text)]"
              >
                <Trash2 size={13} strokeWidth={1.8} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
