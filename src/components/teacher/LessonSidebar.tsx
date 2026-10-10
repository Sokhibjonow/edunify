import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, BookOpen, Layers, Plus, LoaderCircle } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import { useClassModulesQuery } from '@/hooks/useClassModulesQuery'
import { useCreateClassModuleMutation } from '@/hooks/useCreateClassModuleMutation'
import { useCreateLessonMutation } from '@/hooks/useCreateLessonMutation'
import type { Lesson } from '@/types/teacherClass'

type Props = {
  classId: string
  activeLessonId: string | null
  onSelectLesson: (lesson: Lesson) => void
  canEdit: boolean
}

const asideClass = 'teacher-lesson-sidebar w-full border-b border-[var(--color-line)] md:w-56 md:shrink-0 md:border-b-0 md:border-r md:overflow-y-auto'

export default function LessonSidebar({ classId, activeLessonId, onSelectLesson, canEdit }: Props) {
  const { t } = useTranslation()
  const { data: modules, isLoading, isError, refetch } = useClassModulesQuery(classId)
  const createModule = useCreateClassModuleMutation(classId)
  const createLesson = useCreateLessonMutation(classId)
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({})

  function toggleModule(id: string) {
    setOpenModules((prev) => ({ ...prev, [id]: prev[id] === false }))
  }

  if (isLoading) {
    return (
      <aside className="teacher-lesson-sidebar flex w-full items-center justify-center py-8 md:w-56 md:shrink-0">
        <Spinner />
      </aside>
    )
  }

  if (isError) {
    return (
      <aside className={`${asideClass} p-3`}>
        <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
        <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
      </aside>
    )
  }

  return (
    <aside className={asideClass}>
      {!modules?.length && (
        <p className="px-3.5 pt-3 text-sm text-[var(--color-text-soft)]">{t('teacherClass.modulesEmpty')}</p>
      )}
      <ul className="py-1.5">
        {modules?.map((mod) => {
          const isOpen = openModules[mod.id] !== false
          return (
            <li key={mod.id}>
              <button
                type="button"
                onClick={() => toggleModule(mod.id)}
                className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-3.5 py-2 text-left text-sm font-semibold text-[var(--color-text-strong)] hover:bg-[var(--color-surface-hover)]"
              >
                <Layers size={15} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-soft)]" />
                <span className="flex-1 truncate">{mod.title}</span>
                {isOpen
                  ? <ChevronDown size={14} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-soft)]" />
                  : <ChevronRight size={14} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-soft)]" />
                }
              </button>

              {isOpen && (
                <ul>
                  {mod.lessons.map((lesson) => {
                    const active = lesson.id === activeLessonId
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => onSelectLesson(lesson)}
                          className={`flex w-full cursor-pointer items-center gap-2 border-0 py-2 pl-8 pr-3.5 text-left text-sm ${
                            active
                              ? 'bg-[var(--color-primary)] font-semibold text-[var(--color-on-primary)]'
                              : 'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                          }`}
                        >
                          <BookOpen
                            size={14}
                            strokeWidth={1.8}
                            className={`shrink-0 ${active ? 'text-[var(--color-on-primary)]' : 'text-[var(--color-text-soft)]'}`}
                          />
                          <span className="truncate">{lesson.title}</span>
                        </button>
                      </li>
                    )
                  })}
                  {canEdit && (
                    <li className="pl-8 pr-2">
                      <InlineAdd
                        label={t('teacherClass.addLesson')}
                        placeholder={t('teacherClass.lessonTitle')}
                        pending={createLesson.isPending && createLesson.variables?.moduleId === mod.id}
                        onSubmit={(title, done) => createLesson.mutate({ moduleId: mod.id, title }, { onSuccess: done })}
                      />
                    </li>
                  )}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      {canEdit && (
        <div className="border-t border-[var(--color-line)] px-2 py-1.5">
          <InlineAdd
            label={t('teacherClass.addModule')}
            placeholder={t('teacherClass.moduleTitle')}
            pending={createModule.isPending}
            onSubmit={(title, done) => createModule.mutate({ title }, { onSuccess: done })}
          />
        </div>
      )}
    </aside>
  )
}

function InlineAdd({ label, placeholder, pending, onSubmit }: {
  label: string
  placeholder: string
  pending: boolean
  onSubmit: (title: string, done: () => void) => void
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const title = value.trim()
    if (!title) return
    onSubmit(title, () => {
      setValue('')
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center gap-1.5 rounded-md border-0 bg-transparent px-1.5 py-1.5 text-left text-xs text-[var(--color-text-soft)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary)]"
      >
        <Plus size={13} strokeWidth={2} />
        {label}
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1 py-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setValue('') } }}
        onBlur={() => { if (!value.trim()) setOpen(false) }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={!value.trim() || pending}
        aria-label={label}
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-[var(--color-primary)] text-[var(--color-on-primary)] disabled:opacity-50"
      >
        {pending ? <LoaderCircle size={12} strokeWidth={2} className="animate-spin" /> : <Plus size={13} strokeWidth={2} />}
      </button>
    </form>
  )
}
