import { useTranslation } from 'react-i18next'
import ManagerHeader from '@/components/layout/ManagerHeader'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import StatisticsCard from '@/components/home/StatisticsCard'
import ManagerAttendanceCard from '@/components/home/ManagerAttendanceCard'
import CollapsibleListCard from '@/components/home/CollapsibleListCard'
import { useBranchOverviewQuery } from '@/hooks/useBranchOverviewQuery'
import { useAuthStore } from '@/stores/authStore'
import { formatDayMonth } from '@/utils/formatDate'
import type { DuePaymentStudent, PendingAttendanceTeacher } from '@/types/managerHome'

function PendingTeacherCard({ teacher }: { teacher: PendingAttendanceTeacher }) {
  return (
    <div className="pending-teacher-card flex shrink-0 items-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2">
      <span className="truncate text-sm font-medium text-[var(--color-text-strong)]">
        {teacher.name}
      </span>
    </div>
  )
}

function DueStudentCard({ student }: { student: DuePaymentStudent }) {
  const { t } = useTranslation()
  const overdue = student.status === 'overdue'
  const badgeLabel = student.dueDate
    ? formatDayMonth(student.dueDate)
    : overdue
      ? t('managerHome.overdue')
      : t('managerHome.due')
  return (
    <div className="due-student-card flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2">
      <span className="shrink-0 text-sm font-bold leading-none text-[var(--color-text-strong)]">
        {badgeLabel}
      </span>
      <span className="truncate text-sm font-medium text-[var(--color-text-strong)]">
        {student.name} {student.surname}
      </span>
    </div>
  )
}

export default function ManagerHome() {
  const { t } = useTranslation()
  const orgId = useAuthStore((s) => s.organizationId)
  const branchId = useAuthStore((s) => s.branchId)
  const { data, isLoading, isError, refetch } = useBranchOverviewQuery(orgId, branchId)

  return (
    <>
      <ManagerHeader />
      <main className="manager-home-page mx-auto max-w-md pb-24">
        {isLoading ? (
          <Spinner />
        ) : isError || !data || !orgId || !branchId ? (
          <Card>
            <p className="text-sm font-normal text-[var(--color-error-text)]">
              {t('common.loadError')}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)]"
            >
              {t('common.retry')}
            </button>
          </Card>
        ) : (
          <div className="manager-home-overview flex flex-col gap-2 px-2">
            <StatisticsCard
              title={t('managerHome.statistics')}
              orgId={orgId}
              branchId={branchId}
              collapsible
              defaultExpanded={false}
            />

            <ManagerAttendanceCard attendanceTodayPct={data.attendanceTodayPct} />

            <CollapsibleListCard
              className="attendance-pending-card"
              title={t('managerHome.attendancePending')}
              emptyTitle={t('managerHome.noAttendancePending')}
              count={data.pendingTeachers.length}
            >
              <div className="pending-teacher-list flex gap-2 overflow-x-auto pb-1">
                {data.pendingTeachers.map((teacher) => (
                  <PendingTeacherCard key={teacher.teacherId} teacher={teacher} />
                ))}
              </div>
            </CollapsibleListCard>

            <CollapsibleListCard
              className="overdue-payments-card"
              title={t('managerHome.overduePayments')}
              emptyTitle={t('managerHome.noOverduePayments')}
              count={data.duePayments.length}
            >
              <div className="due-student-list flex flex-col gap-2">
                {data.duePayments.map((student) => (
                  <DueStudentCard key={student.studentId} student={student} />
                ))}
              </div>
            </CollapsibleListCard>
          </div>
        )}
      </main>
    </>
  )
}
