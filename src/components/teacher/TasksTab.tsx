import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Star, Calendar, ClipboardList, LoaderCircle } from 'lucide-react'
import { useClassTasksQuery } from '@/hooks/useClassTasksQuery'
import { useCreateTaskMutation } from '@/hooks/useCreateTaskMutation'
import type { Module, TaskPriority } from '@/types/teacherClass'

type Props = {
  classId: string
  modules: Module[]
  canEdit: boolean
}

export default function TasksTab({ classId, modules, canEdit }: Props) {
  const { t } = useTranslation()
  const { data: tasks, isLoading, isError, refetch } = useClassTasksQuery(classId)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lessonId, setLessonId] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')

  const allLessons = modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })))

  const mutation = useCreateTaskMutation(classId)

  function submit() {
    mutation.mutate(
      {
        title,
        description,
        lessonId: lessonId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
      },
      {
        onSuccess: () => {
          setShowForm(false)
          setTitle('')
          setDescription('')
          setLessonId('')
          setDueDate('')
          setPriority('normal')
        },
      },
    )
  }

  if (isLoading) return <div className="flex justify-center py-8"><LoaderCircle size={24} strokeWidth={1.8} className="animate-spin text-[var(--color-primary)]" /></div>

  if (isError) {
    return (
      <div className="rounded-lg border border-[var(--color-line)] p-3">
        <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
        <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 py-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-soft)]">
          {tasks?.length ?? 0} {t('teacherClass.tasks').toLowerCase()}
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-primary)] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-accent-soft)]"
          >
            <Plus size={15} strokeWidth={2} />
            {t('teacherClass.addTask')}
          </button>
        )}
      </div>

      {canEdit && showForm && (
        <div className="rounded-lg border border-[var(--color-line)] p-3.5 space-y-2.5">
          <input
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:outline-none"
            placeholder={t('teacherClass.taskTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
            placeholder={t('teacherClass.taskDesc')}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="normal">{t('teacherClass.priorityNormal')}</option>
              <option value="important">{t('teacherClass.priorityImportant')}</option>
            </select>
            <input
              type="date"
              className="flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          {allLessons.length > 0 && (
            <select
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
            >
              <option value="">{t('teacherClass.taskLessonNone')}</option>
              {allLessons.map((l) => (
                <option key={l.id} value={l.id}>{l.moduleTitle} — {l.title}</option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-[var(--color-line)] py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
            >
              {t('teacherClass.cancel')}
            </button>
            <button
              type="button"
              disabled={!title.trim() || mutation.isPending}
              onClick={submit}
              className="flex-1 rounded-lg bg-[var(--color-primary)] py-2 text-sm font-semibold text-[var(--color-on-primary)] disabled:opacity-50"
            >
              {mutation.isPending ? <LoaderCircle size={16} strokeWidth={1.8} className="animate-spin mx-auto" /> : t('teacherClass.submit')}
            </button>
          </div>
        </div>
      )}

      {!tasks?.length ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <ClipboardList size={36} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
          <p className="text-sm text-[var(--color-text-soft)]">{t('teacherClass.noTasks')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null
            return (
              <li
                key={task.id}
                className={`rounded-lg border p-3 ${
                  task.priority === 'important'
                    ? 'border-[var(--color-warning)] bg-[var(--color-warning-soft)]'
                    : 'border-[var(--color-line)] bg-[var(--color-surface-top)]'
                }`}
              >
                <div className="flex items-start gap-2">
                  {task.priority === 'important' && (
                    <Star size={14} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[var(--color-warning-text)]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${task.priority === 'important' ? 'text-[var(--color-warning-text)]' : 'text-[var(--color-text-strong)]'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-0.5 text-xs text-[var(--color-text-soft)]">{task.description}</p>
                    )}
                    {due && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-[var(--color-text-soft)]">
                        <Calendar size={11} strokeWidth={1.8} />
                        {due}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
