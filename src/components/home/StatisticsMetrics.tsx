import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  GraduationCap,
  Layers,
  CalendarDays,
  CalendarCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { attendanceTextClass } from '@/utils/attendanceColor'
import { revenueFillPct } from '@/utils/statisticsPeriod'
import type { CountMetric, ExpectedRevenueMetric, StatisticsSnapshot } from '@/types/statistics'

function DeltaBadge({ positive, children }: { positive: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-none ${
        positive
          ? 'bg-[var(--color-success-soft)] text-[var(--color-success-text)]'
          : 'bg-[var(--color-error-soft)] text-[var(--color-error-text)]'
      }`}
    >
      {children}
    </span>
  )
}

function MetricDivider() {
  return (
    <div
      className="statistics-metric-divider w-0.5 shrink-0 self-stretch bg-[var(--color-line)]"
      aria-hidden
    />
  )
}

function MetricTile({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2 py-1">
      <p className="truncate text-center text-xs font-medium text-[var(--color-text-strong)]">{label}</p>
      <div className="mt-1.5 flex items-center justify-center gap-1.5">
        <Icon size={16} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-soft)]" />
        {children}
      </div>
    </div>
  )
}

function CountValue({ metric }: { metric: CountMetric }) {
  const { count, delta } = metric
  const showBadge = delta !== null && delta !== 0
  const positive = delta !== null && delta > 0

  return (
    <>
      <span className="text-lg font-semibold leading-none text-[var(--color-text-strong)]">{count}</span>
      {showBadge && <DeltaBadge positive={positive}>{positive ? `+${delta}` : delta}</DeltaBadge>}
    </>
  )
}

function AttendanceValue({ value }: { value: number }) {
  return <span className={`text-lg font-semibold leading-none ${attendanceTextClass(value)}`}>{value}%</span>
}

function ExpectedRevenueValue({ metric }: { metric: ExpectedRevenueMetric }) {
  const { amount, changePct } = metric
  const showBadge = changePct !== null
  const positive = changePct !== null && changePct > 0

  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-sm font-normal text-[var(--color-text-soft)]">{amount}</span>
      {showBadge && <DeltaBadge positive={positive}>{positive ? `+${changePct}%` : `${changePct}%`}</DeltaBadge>}
    </span>
  )
}

function RevenueFillBar({ revenue, expected }: { revenue: number; expected: number }) {
  const pct = revenueFillPct(revenue, expected)

  return (
    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
      <div
        className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-150 ease-in-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

type Props = {
  data: StatisticsSnapshot
}

export default function StatisticsMetrics({ data }: Props) {
  const { t } = useTranslation()

  const counts = [
    { label: t('home.students'), icon: Users, metric: data.students },
    { label: t('home.classes'), icon: Layers, metric: data.classes },
    { label: t('home.teachers'), icon: GraduationCap, metric: data.teachers },
  ]

  return (
    <div className="statistics-metrics flex flex-col gap-2">
      <div className="statistics-counts-section flex items-stretch py-0.5">
        {counts.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <MetricDivider />}
            <MetricTile icon={item.icon} label={item.label}>
              <CountValue metric={item.metric} />
            </MetricTile>
          </Fragment>
        ))}
      </div>

      <div className="attendance-section flex items-stretch py-0.5">
        <MetricTile icon={CalendarDays} label={t('home.averageAttendance')}>
          <AttendanceValue value={data.averageAttendance} />
        </MetricTile>
        <MetricDivider />
        <MetricTile icon={CalendarCheck} label={t('home.attendanceToday')}>
          <AttendanceValue value={data.attendanceToday} />
        </MetricTile>
      </div>

      <div className="revenue-section rounded-lg bg-[var(--color-surface)] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Wallet size={16} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-soft)]" />
            <span className="truncate text-sm font-normal text-[var(--color-text-strong)]">
              {t('home.revenue')} / {t('home.expected')}
            </span>
          </div>
          <span className="shrink-0 text-sm font-normal text-[var(--color-text-strong)]">
            • {t('home.payments')}{' '}
            <span className="font-medium">
              {data.paymentCounts.paid}/{data.paymentCounts.total}
            </span>
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
          <span className="text-lg font-semibold leading-none text-[var(--color-text-strong)]">{data.revenue}</span>
          <span className="text-sm font-normal text-[var(--color-text-soft)]">/</span>
          <ExpectedRevenueValue metric={data.expectedRevenue} />
        </div>

        <RevenueFillBar revenue={data.revenue} expected={data.expectedRevenue.amount} />
      </div>
    </div>
  )
}
