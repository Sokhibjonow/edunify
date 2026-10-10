import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Check, Images } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import PhotoViewer from '@/components/classroom/PhotoViewer'
import HomeworkStatusBadge from '@/components/classroom/HomeworkStatusBadge'
import { useClassHomeworksQuery } from '@/hooks/useClassHomeworksQuery'
import { useClassStudentsQuery } from '@/hooks/useClassStudentsQuery'
import { useReviewHomeworkMutation } from '@/hooks/useReviewHomeworkMutation'
import type { HomeworkSubmission, Lesson } from '@/types/teacherClass'

type Props = {
  classId: string
  lesson: Lesson | null
}

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

type Viewer = { submission: HomeworkSubmission; index: number }

export default function HomeworksTab({ classId, lesson }: Props) {
  const { t, i18n } = useTranslation()
  const { data: homeworks, isLoading, isError, refetch } = useClassHomeworksQuery(classId, lesson?.id)
  const { data: students = [] } = useClassStudentsQuery(classId)
  const [viewer, setViewer] = useState<Viewer | null>(null)

  const review = useReviewHomeworkMutation(classId)

  if (!lesson) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <BookOpen size={36} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
        <p className="text-sm text-[var(--color-text-soft)]">{t('teacherClass.selectLessonForHomework')}</p>
      </div>
    )
  }

  if (isLoading) return <Spinner />

  if (isError) {
    return (
      <Card>
        <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
        <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
      </Card>
    )
  }

  const list = homeworks ?? []
  const submittedIds = new Set(list.map((h) => h.studentId))
  const missing = students.filter((s) => !submittedIds.has(s.uniqueId))
  const total = students.length || list.length
  const pct = total ? Math.round((submittedIds.size / total) * 100) : 0
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-3 py-1">
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-strong)]">{lesson.title}</h2>
          <span className="text-sm text-[var(--color-text-soft)] tabular-nums">
            {t('teacherClass.submittedCount', { done: submittedIds.size, total })}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
          <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${pct}%` }} />
        </div>
        {missing.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[var(--color-text-soft)]">{t('teacherClass.notSubmitted')}:</span>
            {missing.map((s) => (
              <span key={s.uniqueId} className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-text)]">
                {s.name} {s.surname}
              </span>
            ))}
          </div>
        )}
      </div>

      {!list.length ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Images size={36} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
          <p className="text-sm text-[var(--color-text-soft)]">{t('teacherClass.noHomeworks')}</p>
        </div>
      ) : (
        <ul className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((hw) => {
            return (
              <li key={hw.id} className="flex flex-col gap-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-semibold text-[var(--color-primary)]">
                    {initials(hw.studentName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-text-strong)]">{hw.studentName}</p>
                    <p className="text-xs text-[var(--color-text-soft)] tabular-nums">{formatDate(hw.submittedAt)}</p>
                  </div>
                  <HomeworkStatusBadge status={hw.status} />
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {hw.photos.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setViewer({ submission: hw, index: i })}
                      aria-label={t('teacherClass.openPhoto', { n: i + 1 })}
                      className="aspect-[3/4] cursor-zoom-in overflow-hidden rounded-md border border-[var(--color-line)] bg-[var(--color-surface-hover)] p-0"
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>

                {hw.comment && (
                  <p className="rounded-md border-l-2 border-[var(--color-primary)] bg-[var(--color-surface-hover)] px-2.5 py-1.5 text-sm text-[var(--color-text)]">
                    {hw.comment}
                  </p>
                )}

                {hw.status !== 'reviewed' && (
                  <button
                    type="button"
                    disabled={review.isPending && review.variables === hw.id}
                    onClick={() => review.mutate(hw.id)}
                    className="mt-auto inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--color-primary)] bg-transparent py-1.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-accent-soft)] disabled:opacity-50"
                  >
                    <Check size={15} strokeWidth={2} />
                    {t('teacherClass.markReviewed')}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {viewer && (
        <PhotoViewer
          title={viewer.submission.studentName}
          photos={viewer.submission.photos}
          caption={viewer.submission.comment}
          index={viewer.index}
          onIndexChange={(index) => setViewer({ ...viewer, index })}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  )
}
