import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Search, UserPlus, Users } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import EnrollStudentModal from '@/components/students/EnrollStudentModal'
import StudentDetailModal from '@/components/students/StudentDetailModal'
import { useBranchStudentsQuery } from '@/hooks/useBranchStudents'
import { attendanceTextClass } from '@/utils/attendanceColor'
import { formatAmount } from '@/utils/formatMoney'
import type { BranchStudent } from '@/types/branchStudent'

type Filter = 'all' | 'debt' | 'lowAttendance'

/** Same red threshold as attendanceTextClass. */
const LOW_ATTENDANCE_PCT = 70

type Props = { orgId: string; branchId: string }

/** Students of one branch: debts, attendance, card, enroll by ID. Used by manager and director pages. */
export default function BranchStudentsView({ orgId, branchId }: Props) {
  const { t, i18n } = useTranslation()
  const { data: students, isLoading, isError, refetch } = useBranchStudentsQuery(orgId, branchId)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [classId, setClassId] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const money = (n: number) => formatAmount(n, i18n.language)
  const currency = t('payments.currency')
  const list = students ?? []
  const classes = [...new Map(list.flatMap((s) => s.classes.map((c) => [c.id, c.name] as const))).entries()]
  const inClass = list.filter((s) => !classId || s.classes.some((c) => c.id === classId))
  const isLow = (s: BranchStudent) => s.attendance.pct !== null && s.attendance.pct < LOW_ATTENDANCE_PCT
  const counts: Record<Filter, number> = {
    all: inClass.length,
    debt: inClass.filter((s) => s.outstanding > 0).length,
    lowAttendance: inClass.filter(isLow).length,
  }
  const q = query.trim().toLowerCase()
  const visible = inClass
    .filter((s) => filter === 'all' || (filter === 'debt' ? s.outstanding > 0 : isLow(s)))
    .filter((s) => !q || `${s.name} ${s.surname}`.toLowerCase().includes(q) || s.uniqueId.toLowerCase().includes(q))
  const overdueTotal = list.reduce((sum, s) => sum + s.overdue, 0)
  const opened = list.find((s) => s.uniqueId === openId)

  return (
    <>
      <div className="branch-students flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-strong)]">
            {t('staffNav.students')}
            {students && <span className="ml-1.5 text-sm font-normal text-[var(--color-text-soft)] tabular-nums">{students.length}</span>}
          </h2>
          <button
            type="button"
            onClick={() => setEnrolling(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-on-primary)]"
          >
            <UserPlus size={16} strokeWidth={1.8} />
            {t('branchStudents.add')}
          </button>
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError || !students ? (
          <Card>
            <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
            <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
          </Card>
        ) : !students.length ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Users size={36} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
            <p className="text-sm text-[var(--color-text-soft)]">{t('branchStudents.empty')}</p>
          </div>
        ) : (
          <>
            {overdueTotal > 0 && (
              <p className="rounded-lg bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error-text)] tabular-nums">
                {t('branchStudents.overdueTotal', { amount: money(overdueTotal), currency })}
              </p>
            )}

            <div role="tablist" className="flex rounded-lg border border-[var(--color-line)] p-0.5">
              {(['all', 'debt', 'lowAttendance'] as const).map((f) => (
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
                  {t(`branchStudents.filter.${f}`)} <span className="tabular-nums">{counts[f]}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search size={14} strokeWidth={1.8} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('branchStudents.search')}
                  aria-label={t('branchStudents.search')}
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

            {!visible.length ? (
              <p className="py-8 text-center text-sm text-[var(--color-text-soft)]">{t('payments.nothingFound')}</p>
            ) : (
              <ul className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]">
                {visible.map((s) => (
                  <li key={s.uniqueId}>
                    <button
                      type="button"
                      onClick={() => setOpenId(s.uniqueId)}
                      className="flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-3 py-2.5 text-left hover:bg-[var(--color-surface-hover)]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-semibold text-[var(--color-primary)]">
                        {`${s.name[0] ?? ''}${s.surname[0] ?? ''}`.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--color-text-strong)]">{s.name} {s.surname}</p>
                        <p className="truncate text-xs text-[var(--color-text-soft)]">
                          {s.classes.length ? s.classes.map((c) => c.name).join(', ') : t('removeStudent.leftAll')}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-xs tabular-nums">
                        <p className={s.attendance.pct === null ? 'text-[var(--color-text-soft)]' : `font-semibold ${attendanceTextClass(s.attendance.pct)}`}>
                          {s.attendance.pct === null ? '—' : `${s.attendance.pct}%`}
                        </p>
                        {s.outstanding > 0 ? (
                          <p className={`font-semibold ${s.overdue > 0 ? 'text-[var(--color-error-text)]' : 'text-[var(--color-text-strong)]'}`}>
                            −{money(s.outstanding)}
                          </p>
                        ) : (
                          <p className="inline-flex items-center gap-0.5 text-[var(--color-success-text)]">
                            <Check size={12} strokeWidth={2} />
                            {t('branchStudents.paid')}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-center text-xs text-[var(--color-text-soft)]">{t('branchStudents.legend')}</p>
          </>
        )}
      </div>

      {enrolling && (
        <EnrollStudentModal orgId={orgId} branchId={branchId} onClose={() => setEnrolling(false)} />
      )}
      {opened && <StudentDetailModal orgId={orgId} branchId={branchId} student={opened} onClose={() => setOpenId(null)} />}
    </>
  )
}
