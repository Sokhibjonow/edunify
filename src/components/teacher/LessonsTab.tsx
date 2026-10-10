import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen } from 'lucide-react'
import type { Lesson, Module } from '@/types/teacherClass'

type Props = {
  modules: Module[]
  activeLesson: Lesson | null
  /** Extra content under the lesson card, e.g. the teacher's attendance register. */
  children?: ReactNode
}

export default function LessonsTab({ modules, activeLesson, children }: Props) {
  const { t } = useTranslation()

  if (!activeLesson) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-3 py-1">
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <BookOpen size={36} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
          <p className="text-sm text-[var(--color-text-soft)]">{t('teacherClass.selectLesson')}</p>
        </div>
        {children}
      </div>
    )
  }

  const parentModule = modules.find((m) => m.lessons.some((l) => l.id === activeLesson.id))

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 py-1">
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] p-3.5">
        {parentModule && (
          <p className="mb-1 text-xs text-[var(--color-text-soft)]">{parentModule.title}</p>
        )}
        <h2 className="text-[15px] font-semibold text-[var(--color-text-strong)]">
          {activeLesson.title}
        </h2>
        <p className="mt-1 text-xs text-[var(--color-text-soft)]">
          {t('teacherClass.lessonNumber', { n: activeLesson.order })}
        </p>
      </div>

      {children}

      <div className="rounded-lg border border-[var(--color-line)] p-3.5">
        <p className="text-sm text-[var(--color-text-soft)]">
          {t('teacherClass.lessonMaterialsSoon')}
        </p>
      </div>
    </div>
  )
}
