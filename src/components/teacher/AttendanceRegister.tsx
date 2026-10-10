import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, CheckCheck, Clock, FileCheck2, Info, LoaderCircle, Save, X, type LucideIcon } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import { useClassStudentsQuery } from '@/hooks/useClassStudentsQuery'
import { useAttendanceRegisterQuery } from '@/hooks/useAttendanceRegisterQuery'
import { useSaveAttendanceMutation } from '@/hooks/useSaveAttendanceMutation'
import { localDateString } from '@/utils/localDate'
import type { AttendanceStatus, Lesson } from '@/types/teacherClass'

type Props = {
  classId: string
  lesson: Lesson | null
  lessons: Lesson[]
}

const STATUSES: { value: AttendanceStatus; icon: LucideIcon; active: string }[] = [
  { value: 'present', icon: Check, active: 'border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success-text)]' },
  { value: 'late', icon: Clock, active: 'border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning-text)]' },
  { value: 'absent', icon: X, active: 'border-[var(--color-error)] bg-[var(--color-error-soft)] text-[var(--color-error-text)]' },
  { value: 'excused', icon: FileCheck2, active: 'border-[var(--color-primary)] bg-[var(--color-accent-soft)] text-[var(--color-primary)]' },
]

type Edits = { key: string; map: Record<string, AttendanceStatus> }

export default function AttendanceRegister({ classId, lesson, lessons }: Props) {
  const { t, i18n } = useTranslation()
  const today = localDateString()
  const [date, setDate] = useState(today)
  const students = useClassStudentsQuery(classId)
  const register = useAttendanceRegisterQuery(classId, date)
  const save = useSaveAttendanceMutation(classId)
  const [edits, setEdits] = useState<Edits>({ key: '', map: {} })

  // Edits belong to one loaded version of one day's register; a new date or a fresh save resets them.
  const key = `${date}|${register.data?.recordedAt ?? 'new'}`
  const saved = Object.fromEntries((register.data?.records ?? []).map((r) => [r.studentId, r.status]))
  const list = students.data ?? []
  const statusOf = (id: string): AttendanceStatus =>
    (edits.key === key ? edits.map[id] : undefined) ?? saved[id] ?? 'present'
  const taken = !!register.data?.recordedAt
  const dirty = !taken || list.some((s) => statusOf(s.uniqueId) !== (saved[s.uniqueId] ?? 'present'))

  function setStatus(studentId: string, status: AttendanceStatus) {
    setEdits((prev) => ({ key, map: { ...(prev.key === key ? prev.map : {}), [studentId]: status } }))
  }

  function markAllPresent() {
    setEdits({ key, map: Object.fromEntries(list.map((s) => [s.uniqueId, 'present' as const])) })
  }

  function onSave() {
    save.mutate({
      date,
      lessonId: lesson?.id ?? null,
      records: list.map((s) => ({ studentId: s.uniqueId, status: statusOf(s.uniqueId) })),
    })
  }

  const counts = STATUSES.map(({ value }) => ({ value, n: list.filter((s) => statusOf(s.uniqueId) === value).length }))
  const otherLesson = taken && register.data?.lessonId && register.data.lessonId !== lesson?.id
    ? lessons.find((l) => l.id === register.data?.lessonId)
    : undefined

  return (
    <section className="flex flex-col gap-2.5 rounded-lg border border-[var(--color-line)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-[var(--color-text-strong)]">{t('attendance.title')}</h3>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          aria-label={t('attendance.date')}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
        />
      </div>

      {students.isLoading || register.isLoading ? (
        <Spinner />
      ) : students.isError || register.isError ? (
        <div>
          <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
          <button
            type="button"
            onClick={() => { students.refetch(); register.refetch() }}
            className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : !list.length ? (
        <p className="text-sm text-[var(--color-text-soft)]">{t('attendance.noStudents')}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5 text-xs tabular-nums">
              {counts.map(({ value, n }) => (
                <span key={value} className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[var(--color-text-soft)]">
                  {t(`attendance.${value}`)}: <span className="font-semibold text-[var(--color-text-strong)]">{n}</span>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={markAllPresent}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--color-line)] bg-transparent px-2 py-1 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
            >
              <CheckCheck size={14} strokeWidth={1.8} />
              {t('attendance.allPresent')}
            </button>
          </div>

          {!taken && (
            <p className="inline-flex items-start gap-1.5 text-xs text-[var(--color-text-soft)]">
              <Info size={13} strokeWidth={1.8} className="mt-px shrink-0" />
              {t('attendance.notTaken')}
            </p>
          )}
          {otherLesson && (
            <p className="inline-flex items-start gap-1.5 text-xs text-[var(--color-warning-text)]">
              <Info size={13} strokeWidth={1.8} className="mt-px shrink-0" />
              {t('attendance.otherLesson', { lesson: otherLesson.title })}
            </p>
          )}

          <ul className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)]">
            {list.map((s) => {
              const current = statusOf(s.uniqueId)
              return (
                <li key={s.uniqueId} className="flex flex-wrap items-center gap-2 px-2.5 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-text-strong)]">{s.name} {s.surname}</span>
                  <div role="radiogroup" aria-label={`${s.name} ${s.surname}`} className="flex shrink-0 gap-1">
                    {STATUSES.map(({ value, icon: Icon, active }) => {
                      const on = current === value
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          aria-label={t(`attendance.${value}`)}
                          title={t(`attendance.${value}`)}
                          onClick={() => setStatus(s.uniqueId, value)}
                          className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border px-2 text-xs font-semibold ${
                            on ? active : 'border-[var(--color-line)] bg-transparent text-[var(--color-text-soft)] hover:bg-[var(--color-surface-hover)]'
                          }`}
                        >
                          <Icon size={14} strokeWidth={2} />
                          <span className="hidden lg:inline">{t(`attendance.${value}`)}</span>
                        </button>
                      )
                    })}
                  </div>
                </li>
              )
            })}
          </ul>

          {save.isError && <p className="text-sm text-[var(--color-error-text)]">{t('attendance.saveError')}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-[var(--color-text-soft)] tabular-nums">
              {taken && register.data?.recordedAt
                ? t('attendance.savedAt', {
                    time: new Date(register.data.recordedAt).toLocaleString(i18n.language, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                  })
                : ''}
            </span>
            <button
              type="button"
              onClick={onSave}
              disabled={!dirty || save.isPending}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-[var(--color-on-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {save.isPending ? <LoaderCircle size={15} strokeWidth={1.8} className="animate-spin" /> : <Save size={15} strokeWidth={1.8} />}
              {taken ? t('attendance.update') : t('attendance.save')}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
