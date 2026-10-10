import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Search, TriangleAlert, Wallet } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import PaymentLineRow from '@/components/payments/PaymentLineRow'
import RecordPaymentModal from '@/components/payments/RecordPaymentModal'
import { useBranchPaymentsQuery } from '@/hooks/useBranchPaymentsQuery'
import { useDeletePaymentMutation } from '@/hooks/usePaymentMutations'
import { formatAmount, formatMonth, shiftMonth } from '@/utils/formatMoney'
import { localDateString } from '@/utils/localDate'
import type { BillingLine } from '@/types/payments'

type Filter = 'unpaid' | 'paid' | 'all'

type Props = { orgId: string; branchId: string }

/** Payments of one branch for a month: summary, filters, lines, accept/undo. Used by manager and director pages. */
export default function BranchPaymentsView({ orgId, branchId }: Props) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const currentMonth = localDateString().slice(0, 7)
  // Other pages (e.g. a student's card) can open a specific month
  const [month, setMonth] = useState(() => (location.state as { month?: string } | null)?.month ?? currentMonth)
  const [filter, setFilter] = useState<Filter>('unpaid')
  const [classId, setClassId] = useState('')
  const [query, setQuery] = useState('')
  const [accepting, setAccepting] = useState<BillingLine | null>(null)
  const [undoing, setUndoing] = useState<{ id: string; amount: number; name: string } | null>(null)
  const { data, isLoading, isError, refetch } = useBranchPaymentsQuery(orgId, branchId, month)
  const undo = useDeletePaymentMutation(orgId, branchId)

  const money = (n: number) => formatAmount(n, i18n.language)
  const currency = t('payments.currency')
  const items = data?.items ?? []
  const classes = [...new Map(items.map((l) => [l.classId, l.className])).entries()]
  const inClass = items.filter((l) => !classId || l.classId === classId)
  const counts: Record<Filter, number> = {
    unpaid: inClass.filter((l) => l.status !== 'paid').length,
    paid: inClass.filter((l) => l.status === 'paid').length,
    all: inClass.length,
  }
  const q = query.trim().toLowerCase()
  const visible = inClass
    .filter((l) => filter === 'all' || (filter === 'paid' ? l.status === 'paid' : l.status !== 'paid'))
    .filter((l) => !q || l.studentName.toLowerCase().includes(q))
  const s = data?.summary
  const pct = s && s.expected > 0 ? Math.min(100, Math.round((s.collected / s.expected) * 100)) : 0

  return (
    <>
      <div className="branch-payments flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label={t('payments.prevMonth')}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-line)] bg-transparent text-[var(--color-text)]"
          >
            <ChevronLeft size={18} strokeWidth={1.8} />
          </button>
          <div className="text-center">
            <p className="text-[15px] font-semibold capitalize text-[var(--color-text-strong)]">{formatMonth(month, i18n.language)}</p>
            {month !== currentMonth && (
              <button type="button" onClick={() => setMonth(currentMonth)} className="cursor-pointer border-0 bg-transparent p-0 text-xs text-[var(--color-primary)]">
                {t('payments.backToCurrent')}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, 1))}
            disabled={month >= shiftMonth(currentMonth, 3)}
            aria-label={t('payments.nextMonth')}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-line)] bg-transparent text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={18} strokeWidth={1.8} />
          </button>
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError || !data ? (
          <Card>
            <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
            <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
          </Card>
        ) : (
          <>
            <section className="flex flex-col gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] p-3">
              <p className="text-xs text-[var(--color-text-soft)]">{t('payments.collected')}</p>
              <p className="text-xl font-semibold text-[var(--color-text-strong)] tabular-nums">
                {money(s!.collected)} <span className="text-sm font-normal text-[var(--color-text-soft)]">/ {money(s!.expected)} {currency}</span>
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-text-soft)] tabular-nums">
                <span>{t('payments.paidCount', { paid: s!.paidCount, total: s!.totalCount })}</span>
                <span>{t('payments.outstanding', { amount: money(s!.outstanding), currency })}</span>
                {s!.overdueCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[var(--color-error-text)]">
                    <TriangleAlert size={12} strokeWidth={1.8} />
                    {t('payments.overdueCount', { n: s!.overdueCount })}
                  </span>
                )}
              </div>
            </section>

            {items.length > 0 && (
              <div className="flex flex-col gap-2">
                <div role="tablist" className="flex rounded-lg border border-[var(--color-line)] p-0.5">
                  {(['unpaid', 'paid', 'all'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="tab"
                      aria-selected={filter === f}
                      onClick={() => setFilter(f)}
                      className={`flex-1 cursor-pointer rounded-md border-0 py-1.5 text-xs font-semibold ${
                        filter === f ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'bg-transparent text-[var(--color-text-soft)]'
                      }`}
                    >
                      {t(`payments.filter.${f}`)} <span className="tabular-nums">{counts[f]}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search size={14} strokeWidth={1.8} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)]" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('payments.search')}
                      aria-label={t('payments.search')}
                      className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] py-1.5 pl-8 pr-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  {classes.length > 1 && (
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      aria-label={t('payments.class')}
                      className="max-w-[45%] rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)]"
                    >
                      <option value="">{t('payments.allClasses')}</option>
                      {classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )}

            {!items.length ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Wallet size={36} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
                <p className="text-sm text-[var(--color-text-soft)]">{t('payments.empty')}</p>
              </div>
            ) : !visible.length ? (
              <p className="py-8 text-center text-sm text-[var(--color-text-soft)]">
                {filter === 'unpaid' && !q ? t('payments.allPaid') : t('payments.nothingFound')}
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]">
                {visible.map((line) => (
                  <PaymentLineRow
                    key={`${line.classId}|${line.studentId}`}
                    line={line}
                    onAccept={() => setAccepting(line)}
                    onUndo={(id, amount) => setUndoing({ id, amount, name: line.studentName })}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {accepting && (
        <RecordPaymentModal orgId={orgId} branchId={branchId} month={month} line={accepting} onClose={() => setAccepting(null)} />
      )}
      {undoing && (
        <ConfirmDeleteModal
          title={t('payments.undoTitle')}
          warningText={t('payments.undoWarning', { amount: money(undoing.amount), currency, name: undoing.name })}
          icon={<TriangleAlert size={48} strokeWidth={1.8} />}
          onCancel={() => { setUndoing(null); undo.reset() }}
          onConfirm={() => undo.mutate(undoing.id, { onSuccess: () => setUndoing(null) })}
          error={undo.isError ? t('auth.genericError') : null}
          pending={undo.isPending}
        />
      )}
    </>
  )
}
