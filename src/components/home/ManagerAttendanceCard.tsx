import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import { attendanceTextClass } from '@/utils/attendanceColor'

type Props = {
  attendanceTodayPct: number
}

/** Card 1: single line — a percentage badge followed by the "Attendance today" label. */
export default function ManagerAttendanceCard({ attendanceTodayPct }: Props) {
  const { t } = useTranslation()

  return (
    <Card className="attendance-today-card flex items-center gap-2">
      <span
        className={`rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-sm font-semibold leading-none ${attendanceTextClass(attendanceTodayPct)}`}
      >
        {attendanceTodayPct}%
      </span>
      <span className="text-sm font-semibold text-[var(--color-text-strong)]">
        {t('managerHome.attendanceToday')}
      </span>
    </Card>
  )
}
