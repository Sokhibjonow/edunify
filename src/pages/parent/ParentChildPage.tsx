import type { ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Calendar, Check, CircleAlert, GraduationCap, Images, Star } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import HomeworkStatusBadge from '@/components/classroom/HomeworkStatusBadge'
import { useAuthStore } from '@/stores/authStore'
import { useChildOverviewQuery } from '@/hooks/useParent'
import { attendanceTextClass } from '@/utils/attendanceColor'
import { formatAmount, formatMonth } from '@/utils/formatMoney'

const ATTENDANCE_BADGE: Record<'present' | 'late' | 'absent' | 'excused', string> = {
  present: 'text-[var(--color-success-text)] bg-[var(--color-success-soft)]',
  late: 'text-[var(--color-warning-text)] bg-[var(--color-warning-soft)]',
  absent: 'text-[var(--color-error-text)] bg-[var(--color-error-soft)]',
  excused: 'text-[var(--color-primary)] bg-[var(--color-accent-soft)]',
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-[var(--color-line)] p-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-soft)]">{title}</h2>
      {children}
    </section>
  )
}

/** Read-only view of one linked child for a parent. */
export default function ParentChildPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)!
  const { data, isLoading, isError, refetch } = useChildOverviewQuery(user.role === 'parent' ? user.uniqueId : null, studentId)

  if (user.role !== 'parent') return <Navigate to="/home" replace />

  const money = (n: number) => formatAmount(n, i18n.language)
  const currency = t('payments.currency')
  const day = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' })

  return (
    <div className="parent-child-page flex min-h-full flex-col">
      <header className="flex items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5">
        <button
          type="button"
          onClick={() => navigate('/home')}
          aria-label={t('teacherClass.back')}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-line)] bg-transparent text-[var(--color-text-soft)] hover:bg-[var(--color-surface-hover)]"
        >
          <ArrowLeft size={16} strokeWidth={1.8} />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold text-[var(--color-text-strong)]">
          {data ? `${data.student.name} ${data.student.surname}` : '…'}
        </p>
        <span className="w-9 shrink-0" />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-3 p-3 pb-8">
        {isLoading ? (
          <Spinner />
        ) : isError || !data ? (
          <Card>
            <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
            <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-[var(--color-line)] p-2">
                <p className={`text-lg font-semibold tabular-nums ${data.attendance.pct === null ? 'text-[var(--color-text-soft)]' : attendanceTextClass(data.attendance.pct)}`}>
                  {data.attendance.pct === null ? '—' : `${data.attendance.pct}%`}
                </p>
                <p className="text-[11px] text-[var(--color-text-soft)]">{t('parent.attendanceShort')}</p>
              </div>
              <div className="rounded-lg border border-[var(--color-line)] p-2">
                <p className={`text-lg font-semibold tabular-nums ${data.homework.missing.length ? 'text-[var(--color-error-text)]' : 'text-[var(--color-success-text)]'}`}>
                  {data.homework.missing.length}
                </p>
                <p className="text-[11px] text-[var(--color-text-soft)]">{t('parent.missingShort')}</p>
              </div>
              <div className="rounded-lg border border-[var(--color-line)] p-2">
                <p className={`text-lg font-semibold tabular-nums ${data.payments.overdue > 0 ? 'text-[var(--color-error-text)]' : data.payments.outstanding > 0 ? 'text-[var(--color-text-strong)]' : 'text-[var(--color-success-text)]'}`}>
                  {data.payments.outstanding > 0 ? money(data.payments.outstanding) : '0'}
                </p>
                <p className="text-[11px] text-[var(--color-text-soft)]">{t('parent.toPayShort', { currency })}</p>
              </div>
            </div>

            <Section title={t('branchStudents.classes')}>
              {!data.classes.length ? (
                <p className="text-sm text-[var(--color-text-soft)]">{t('parent.noClasses')}</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {data.classes.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-[var(--color-text-strong)]">{c.name}</span>
                      {c.teacherName && (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-soft)]">
                          <GraduationCap size={13} strokeWidth={1.8} />
                          {c.teacherName}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={t('branchStudents.attendance30')}>
              {data.attendance.total === 0 ? (
                <p className="text-sm text-[var(--color-text-soft)]">{t('branchStudents.noAttendance')}</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-text-soft)] tabular-nums">
                    {(['present', 'late', 'absent', 'excused'] as const).map((k) => (
                      <span key={k}>{t(`attendance.${k}`)}: <span className="font-semibold text-[var(--color-text-strong)]">{data.attendance[k]}</span></span>
                    ))}
                  </div>
                  <ul className="flex flex-col gap-1">
                    {data.attendance.recent.map((a, i) => (
                      <li key={`${a.date}-${i}`} className="flex items-center gap-2 text-sm">
                        <span className="w-14 shrink-0 text-xs text-[var(--color-text-soft)] tabular-nums">{day(a.date)}</span>
                        <span className="min-w-0 flex-1 truncate text-[var(--color-text)]">{a.className}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ATTENDANCE_BADGE[a.status]}`}>{t(`attendance.${a.status}`)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Section>

            <Section title={t('parent.homework')}>
              {data.homework.missing.length > 0 && (
                <div className="flex flex-col gap-1.5 rounded-md bg-[var(--color-error-soft)] p-2">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-error-text)]">
                    <CircleAlert size={13} strokeWidth={2} />
                    {t('parent.missingTitle')}
                  </p>
                  {data.homework.missing.map((task) => (
                    <p key={task.taskId} className="text-sm text-[var(--color-text-strong)]">
                      {task.title}
                      <span className="block text-xs text-[var(--color-text-soft)]">
                        {task.className}{task.lessonTitle ? ` · ${task.lessonTitle}` : ''}{task.dueDate ? ` · ${t('studentClass.dueBy', { date: day(task.dueDate) })}` : ''}
                      </span>
                    </p>
                  ))}
                </div>
              )}

              <p className="text-xs font-semibold text-[var(--color-text)]">{t('parent.upcoming')}</p>
              {!data.homework.upcoming.length ? (
                <p className="text-sm text-[var(--color-text-soft)]">{t('parent.noUpcoming')}</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {data.homework.upcoming.map((task) => (
                    <li key={task.taskId} className="flex items-start gap-2 text-sm">
                      {task.priority === 'important'
                        ? <Star size={13} strokeWidth={1.8} className="mt-1 shrink-0 text-[var(--color-warning-text)]" />
                        : <Calendar size={13} strokeWidth={1.8} className="mt-1 shrink-0 text-[var(--color-text-soft)]" />}
                      <span className="min-w-0 flex-1">
                        <span className="text-[var(--color-text-strong)]">{task.title}</span>
                        <span className="block text-xs text-[var(--color-text-soft)]">
                          {task.className}{task.dueDate ? ` · ${t('studentClass.dueBy', { date: day(task.dueDate) })}` : ''}
                        </span>
                      </span>
                      {task.submitted && (
                        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-[var(--color-success-text)]">
                          <Check size={12} strokeWidth={2} />
                          {t('parent.sent')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-1 text-xs font-semibold text-[var(--color-text)]">{t('parent.recentSubmissions')}</p>
              {!data.homework.recent.length ? (
                <p className="text-sm text-[var(--color-text-soft)]">{t('teacherClass.noHomeworks')}</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {data.homework.recent.map((h) => (
                    <li key={h.id} className="flex items-start gap-2 text-sm">
                      <span className="w-14 shrink-0 pt-0.5 text-xs text-[var(--color-text-soft)] tabular-nums">{day(h.submittedAt)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="text-[var(--color-text-strong)]">{h.lessonTitle}</span>
                        <span className="flex items-center gap-1 text-xs text-[var(--color-text-soft)]">
                          {h.className}
                          <Images size={11} strokeWidth={1.8} className="ml-1" />
                          {h.photoCount}
                        </span>
                      </span>
                      <HomeworkStatusBadge status={h.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={t('branchStudents.payments')}>
              {!data.payments.unpaid.length ? (
                <p className="inline-flex items-center gap-1.5 text-sm text-[var(--color-success-text)]">
                  <Check size={14} strokeWidth={2} />
                  {t('branchStudents.allPaid')}
                </p>
              ) : (
                <ul className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)]">
                  {data.payments.unpaid.map((l) => (
                    <li key={`${l.className}|${l.period}`} className="flex items-center gap-2 px-2.5 py-1.5 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="capitalize text-[var(--color-text-strong)]">{formatMonth(l.period, i18n.language)}</span>
                        <span className="block truncate text-xs text-[var(--color-text-soft)]">
                          {l.className} · {l.status === 'overdue' ? t('payments.overdueSince', { date: day(l.dueDate) }) : t('payments.dueBy', { date: day(l.dueDate) })}
                        </span>
                      </span>
                      <span className={`shrink-0 font-semibold tabular-nums ${l.status === 'overdue' ? 'text-[var(--color-error-text)]' : 'text-[var(--color-text-strong)]'}`}>
                        {money(l.balance)} {currency}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-[var(--color-text-soft)]">{t('parent.howToPay')}</p>

              {data.payments.recent.length > 0 && (
                <>
                  <p className="mt-1 text-xs font-semibold text-[var(--color-text)]">{t('parent.recentPayments')}</p>
                  <ul className="flex flex-col gap-1">
                    {data.payments.recent.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 text-sm">
                        <span className="w-14 shrink-0 text-xs text-[var(--color-text-soft)] tabular-nums">{day(p.paidAt)}</span>
                        <span className="min-w-0 flex-1 truncate text-[var(--color-text)]">
                          {p.className} · <span className="capitalize">{formatMonth(p.period, i18n.language)}</span>
                        </span>
                        <span className="shrink-0 font-semibold text-[var(--color-success-text)] tabular-nums">{money(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Section>
          </>
        )}
      </main>
    </div>
  )
}
