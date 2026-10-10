import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import StatisticsMetrics from '@/components/home/StatisticsMetrics'
import { useStatisticsQuery } from '@/hooks/useStatisticsQuery'
import { currentMonth, formatMonthLabel, listSelectableMonths } from '@/utils/statisticsPeriod'

type Props = {
  title: string
  orgId: string
  branchId?: string | null
  collapsible?: boolean
  defaultExpanded?: boolean
}
// Overall

const monthSelectClass =
  'w-full cursor-pointer appearance-none rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] py-1.5 pl-2.5 pr-7 text-xs font-medium text-[var(--color-text-strong)] outline-none transition-colors duration-150 ease-in-out hover:border-[var(--color-line-strong)] focus:border-[var(--color-primary)]'

export default function StatisticsCard({
  title,
  orgId,
  branchId = null,
  collapsible = false,
  defaultExpanded = true,
}: Props) {
  const { t, i18n } = useTranslation()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [fromMonth, setFromMonth] = useState(currentMonth)
  const [toMonth, setToMonth] = useState(currentMonth)

  const isOpen = !collapsible || expanded
  const period = { from: fromMonth, to: toMonth }
  const { data, isLoading, isError, refetch } = useStatisticsQuery(orgId, period, branchId)

  const months = useMemo(() => listSelectableMonths(12), [])

  const toggle = () => {
    if (collapsible) setExpanded((v) => !v)
  }

  const renderMonthSelect = (value: string, onChange: (v: string) => void, ariaLabel: string) => (
    <div className="relative min-w-0 flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={monthSelectClass}
      >
        {months.map((m) => (
          <option key={m} value={m}>
            {formatMonthLabel(m, i18n.language)}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.8}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)]"
      />
    </div>
  )

  const cardClass = branchId ? 'branch-statistics-card' : 'overall-statistics-card'

  return (
    <Card className={`overflow-hidden !p-0 ${cardClass}`}>
      <div
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? expanded : undefined}
        onClick={toggle}
        onKeyDown={
          collapsible
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle()
                }
              }
            : undefined
        }
        className={`statistics-card-header relative px-3.5 py-2.5 ${isOpen && !branchId ? 'border-b border-[var(--color-line)]' : ''} ${
          collapsible
            ? branchId
              ? 'cursor-pointer'
              : 'cursor-pointer transition-colors duration-150 ease-in-out hover:bg-[var(--color-surface-hover)]'
            : ''
        }`}
      >
        {collapsible && (
          <ChevronDown
            size={18}
            strokeWidth={1.8}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)] transition-transform duration-150 ease-in-out ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        )}
        <h2 className="truncate px-6 text-center text-lg font-semibold tracking-tight text-[var(--color-text-strong)]">
          {title}
        </h2>
      </div>

      {isOpen && (
        <div
          className={`statistics-card-body flex flex-col gap-3 ${
            branchId ? 'px-3.5 pb-3.5 pt-0' : 'p-3.5'
          }`}
        >
          <div
            className="statistics-period-filter flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {renderMonthSelect(fromMonth, setFromMonth, t('home.from'))}
            <span
              className="shrink-0 text-sm font-medium text-[var(--color-text-soft)]"
              aria-hidden="true"
            >
              –
            </span>
            {renderMonthSelect(toMonth, setToMonth, t('home.to'))}
          </div>

          {isLoading ? (
            <Spinner />
          ) : isError || !data ? (
            <div>
              <p className="text-sm font-normal text-[var(--color-error-text)]">{t('common.loadError')}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)]"
              >
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <StatisticsMetrics data={data} />
          )}
        </div>
      )}
    </Card>
  )
}
