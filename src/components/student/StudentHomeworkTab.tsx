import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Calendar, Camera, CheckCircle2, LoaderCircle, RotateCcw, Send, Star, X } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import PhotoViewer from '@/components/classroom/PhotoViewer'
import HomeworkStatusBadge from '@/components/classroom/HomeworkStatusBadge'
import { useClassHomeworksQuery } from '@/hooks/useClassHomeworksQuery'
import { useClassTasksQuery } from '@/hooks/useClassTasksQuery'
import { useSubmitHomeworkMutation } from '@/hooks/useSubmitHomeworkMutation'
import type { HomeworkSubmission, Lesson } from '@/types/teacherClass'

const MAX_PHOTOS = 5
const MAX_PHOTO_MB = 5

type Props = {
  classId: string
  lesson: Lesson | null
}

export default function StudentHomeworkTab({ classId, lesson }: Props) {
  const { t } = useTranslation()
  const homeworks = useClassHomeworksQuery(classId, lesson?.id)
  const tasks = useClassTasksQuery(classId)
  const [editing, setEditing] = useState(false)

  if (!lesson) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <BookOpen size={36} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
        <p className="text-sm text-[var(--color-text-soft)]">{t('studentClass.selectLesson')}</p>
      </div>
    )
  }

  if (homeworks.isLoading || tasks.isLoading) return <Spinner />

  if (homeworks.isError || tasks.isError) {
    return (
      <div className="rounded-lg border border-[var(--color-line)] p-3">
        <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
        <button
          type="button"
          onClick={() => { homeworks.refetch(); tasks.refetch() }}
          className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]"
        >
          {t('common.retry')}
        </button>
      </div>
    )
  }

  const mine = homeworks.data?.[0]
  const lessonTasks = (tasks.data ?? []).filter((task) => task.lessonId === lesson.id)
  const showForm = !mine || editing

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 py-1">
      <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] p-3">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-strong)]">{lesson.title}</h2>
        {lessonTasks.length ? (
          <ul className="mt-2 flex flex-col gap-2">
            {lessonTasks.map((task) => (
              <li key={task.id} className="rounded-md border-l-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-2.5 py-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-strong)]">
                  {task.priority === 'important' && <Star size={13} strokeWidth={1.8} className="shrink-0 text-[var(--color-warning-text)]" />}
                  {task.title}
                </p>
                {task.description && <p className="mt-0.5 text-sm text-[var(--color-text)]">{task.description}</p>}
                {task.dueDate && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-text-soft)] tabular-nums">
                    <Calendar size={11} strokeWidth={1.8} />
                    {t('studentClass.dueBy', { date: new Date(task.dueDate).toLocaleDateString() })}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">{t('studentClass.noAssignment')}</p>
        )}
      </section>

      {mine && !editing && <MySubmission submission={mine} onResubmit={() => setEditing(true)} />}

      {showForm && (
        <SubmitForm
          key={lesson.id}
          classId={classId}
          lessonId={lesson.id}
          isResubmit={!!mine}
          onCancel={mine ? () => setEditing(false) : undefined}
          onDone={() => setEditing(false)}
        />
      )}
    </div>
  )
}

function MySubmission({ submission, onResubmit }: { submission: HomeworkSubmission; onResubmit: () => void }) {
  const { t } = useTranslation()
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  return (
    <section className="flex flex-col gap-2.5 rounded-lg border border-[var(--color-line)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('studentClass.mySubmission')}</h3>
          <p className="text-xs text-[var(--color-text-soft)] tabular-nums">{new Date(submission.submittedAt).toLocaleString()}</p>
        </div>
        <HomeworkStatusBadge status={submission.status} />
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        {submission.photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setViewerIndex(i)}
            aria-label={t('teacherClass.openPhoto', { n: i + 1 })}
            className="aspect-[3/4] cursor-zoom-in overflow-hidden rounded-md border border-[var(--color-line)] bg-[var(--color-surface-hover)] p-0"
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {submission.comment && (
        <p className="rounded-md border-l-2 border-[var(--color-primary)] bg-[var(--color-surface-hover)] px-2.5 py-1.5 text-sm text-[var(--color-text)]">
          {submission.comment}
        </p>
      )}

      {submission.status === 'reviewed' ? (
        <p className="inline-flex items-center gap-1.5 text-sm text-[var(--color-success-text)]">
          <CheckCircle2 size={15} strokeWidth={1.8} />
          {t('studentClass.reviewedNote')}
        </p>
      ) : (
        <button
          type="button"
          onClick={onResubmit}
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 self-start rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
        >
          <RotateCcw size={14} strokeWidth={1.8} />
          {t('studentClass.resubmit')}
        </button>
      )}

      {viewerIndex !== null && (
        <PhotoViewer
          title={t('studentClass.mySubmission')}
          photos={submission.photos}
          caption={submission.comment}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </section>
  )
}

type Picked = { file: File; url: string }

function SubmitForm({ classId, lessonId, isResubmit, onCancel, onDone }: {
  classId: string
  lessonId: string
  isResubmit: boolean
  onCancel?: () => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const submit = useSubmitHomeworkMutation(classId)
  const [photos, setPhotos] = useState<Picked[]>([])
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const photosRef = useRef(photos)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), [])

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    setError(null)
    const accepted: Picked[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) { setError(t('studentClass.errorNotImage')); continue }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) { setError(t('studentClass.errorTooLarge', { mb: MAX_PHOTO_MB })); continue }
      accepted.push({ file, url: URL.createObjectURL(file) })
    }
    const room = MAX_PHOTOS - photos.length
    if (accepted.length > room) {
      setError(t('studentClass.errorTooMany', { max: MAX_PHOTOS }))
      accepted.splice(room).forEach((p) => URL.revokeObjectURL(p.url))
    }
    setPhotos((prev) => [...prev, ...accepted])
  }

  function remove(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!photos.length) { setError(t('studentClass.errorNeedPhoto')); return }
    submit.mutate(
      { lessonId, comment: comment.trim(), photos: photos.map((p) => p.file) },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2.5 rounded-lg border border-[var(--color-primary)] p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-strong)]">
          {isResubmit ? t('studentClass.resubmitTitle') : t('studentClass.submitTitle')}
        </h3>
        <span className="text-xs text-[var(--color-text-soft)] tabular-nums">{photos.length} / {MAX_PHOTOS}</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        {photos.map((p, i) => (
          <div key={p.url} className="relative aspect-[3/4] overflow-hidden rounded-md border border-[var(--color-line)] bg-[var(--color-surface-hover)]">
            <img src={p.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={t('studentClass.removePhoto', { n: i + 1 })}
              className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-top)] p-0 text-[var(--color-text)]"
            >
              <X size={13} strokeWidth={2} />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[var(--color-line-strong)] bg-transparent p-1 text-[var(--color-text-soft)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <Camera size={20} strokeWidth={1.8} />
            <span className="text-center text-xs">{t('studentClass.addPhotos')}</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
      <p className="text-xs text-[var(--color-text-soft)]">{t('studentClass.photosHint', { max: MAX_PHOTOS, mb: MAX_PHOTO_MB })}</p>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={2000}
        placeholder={t('studentClass.commentPlaceholder')}
        aria-label={t('studentClass.commentPlaceholder')}
        className="w-full resize-none rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:outline-none"
      />

      {error && <p className="text-sm text-[var(--color-error-text)]">{error}</p>}
      {submit.isError && <p className="text-sm text-[var(--color-error-text)]">{t('studentClass.errorSubmit')}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent py-1.5 text-sm text-[var(--color-text)]"
          >
            {t('teacherClass.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={submit.isPending}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] py-1.5 text-sm font-semibold text-[var(--color-on-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submit.isPending ? <LoaderCircle size={16} strokeWidth={1.8} className="animate-spin" /> : <Send size={15} strokeWidth={1.8} />}
          {t('studentClass.send')}
        </button>
      </div>
    </form>
  )
}
