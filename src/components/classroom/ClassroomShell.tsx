import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useActiveOrganizationBranding } from '@/hooks/useActiveOrganizationBranding'
import { useDocumentBranding } from '@/hooks/useDocumentBranding'
import { useClassModulesQuery } from '@/hooks/useClassModulesQuery'
import { useClassQuery } from '@/hooks/useClassQuery'
import LessonSidebar from '@/components/teacher/LessonSidebar'
import LessonsTab from '@/components/teacher/LessonsTab'
import TasksTab from '@/components/teacher/TasksTab'
import type { ClassItem, Lesson } from '@/types/teacherClass'

type Tab = 'lessons' | 'tasks' | 'homeworks'

type Props = {
  classId: string
  backTo: string
  /** Teacher: add modules, lessons and tasks. */
  canEdit: boolean
  headerAction?: (cls: ClassItem | undefined) => ReactNode
  renderHomework: (lesson: Lesson | null) => ReactNode
  /** Shown under the lesson card in the Lessons tab. */
  renderLessonExtra?: (lesson: Lesson | null, lessons: Lesson[]) => ReactNode
}

/** Class page layout shared by teacher and student: header, three tabs, lesson sidebar. */
export default function ClassroomShell({ classId, backTo, canEdit, headerAction, renderHomework, renderLessonExtra }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { name: orgName } = useActiveOrganizationBranding()
  const [activeTab, setActiveTab] = useState<Tab>('lessons')
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const { data: modules = [] } = useClassModulesQuery(classId)
  const { data: cls, isError, refetch } = useClassQuery(classId)

  useDocumentBranding()

  const allLessons = modules.flatMap((m) => m.lessons)
  const activeLesson = allLessons.find((l) => l.id === activeLessonId) ?? allLessons[0] ?? null

  const tabs: { key: Tab; label: string }[] = [
    { key: 'lessons', label: t('teacherClass.lessons') },
    { key: 'tasks', label: t('teacherClass.tasks') },
    { key: 'homeworks', label: t('teacherClass.homeworks') },
  ]

  return (
    <div className="classroom flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          aria-label={t('teacherClass.back')}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-line)] bg-transparent text-[var(--color-text-soft)] hover:bg-[var(--color-surface-hover)]"
        >
          <ArrowLeft size={16} strokeWidth={1.8} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[15px] font-semibold text-[var(--color-text-strong)]">{cls?.name ?? '…'}</p>
          {orgName && <p className="truncate text-xs text-[var(--color-text-soft)]">{orgName}</p>}
        </div>
        <div className="flex min-w-9 shrink-0 justify-end">{headerAction?.(cls)}</div>
      </header>

      {isError ? (
        <div className="mx-auto w-full max-w-sm p-3">
          <div className="rounded-lg border border-[var(--color-line)] p-3">
            <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
            <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex border-b border-[var(--color-line)] bg-[var(--color-surface)]">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex-1 cursor-pointer border-0 border-b-2 bg-transparent py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === key
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-text-soft)] hover:text-[var(--color-text)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
            <div className="md:overflow-y-auto">
              <LessonSidebar
                classId={classId}
                activeLessonId={activeLesson?.id ?? null}
                onSelectLesson={(lesson) => setActiveLessonId(lesson.id)}
                canEdit={canEdit}
              />
            </div>

            <div className="min-w-0 flex-1 overflow-y-auto p-3.5">
              {activeTab === 'lessons' && (
                <LessonsTab modules={modules} activeLesson={activeLesson}>
                  {renderLessonExtra?.(activeLesson, allLessons)}
                </LessonsTab>
              )}
              {activeTab === 'tasks' && <TasksTab classId={classId} modules={modules} canEdit={canEdit} />}
              {activeTab === 'homeworks' && renderHomework(activeLesson)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
