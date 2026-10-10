import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, Key, Plus, LoaderCircle, School, ChevronRight } from 'lucide-react'
import ManagerHeader from '@/components/layout/ManagerHeader'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import { useAuthStore } from '@/stores/authStore'
import { useTeacherClassesQuery } from '@/hooks/useTeacherClassesQuery'
import { useCreateTeacherClassMutation } from '@/hooks/useCreateTeacherClassMutation'

export default function TeacherClassesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)!
  const teacherId = user.uniqueId
  const { data: classes, isLoading, isError, refetch } = useTeacherClassesQuery(teacherId)
  const create = useCreateTeacherClassMutation(teacherId)
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate({ name: name.trim() }, {
      onSuccess: (cls) => {
        setName('')
        setFormOpen(false)
        navigate(`/classes/${cls.id}`, { state: { openStudents: true } })
      },
    })
  }

  return (
    <>
      <ManagerHeader />
      <main className="teacher-classes-page mx-auto max-w-md p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-strong)]">
            {t('teacherClass.myClasses')}
          </h2>
          {!formOpen && (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-on-primary)]"
            >
              <Plus size={16} strokeWidth={2} />
              {t('teacherClass.createClass')}
            </button>
          )}
        </div>

        {formOpen && (
          <form onSubmit={onSubmit} className="mb-3 flex flex-col gap-2 rounded-lg border border-[var(--color-primary)] p-3">
            <label htmlFor="new-class-name" className="text-sm text-[var(--color-text)]">{t('teacherClass.className')}</label>
            <input
              id="new-class-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('teacherClass.classNamePlaceholder')}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:outline-none"
            />
            {create.isError && <p className="text-sm text-[var(--color-error-text)]">{create.error.message}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setFormOpen(false); setName('') }}
                className="flex-1 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent py-1.5 text-sm text-[var(--color-text)]"
              >
                {t('teacherClass.cancel')}
              </button>
              <button
                type="submit"
                disabled={!name.trim() || create.isPending}
                className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] py-1.5 text-sm font-semibold text-[var(--color-on-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {create.isPending ? <LoaderCircle size={16} strokeWidth={1.8} className="animate-spin" /> : t('teacherClass.create')}
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <Card>
            <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
            <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
          </Card>
        ) : !classes?.length ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <School size={36} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
            <p className="text-sm text-[var(--color-text-soft)]">{t('teacherClass.noClasses')}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {classes.map((cls) => (
              <li key={cls.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/classes/${cls.id}`)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-left hover:bg-[var(--color-surface-hover)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-[var(--color-text-strong)]">{cls.name}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-text-soft)]">
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} strokeWidth={1.8} />
                        {cls.studentIds.length} {t('teacherClass.students')}
                      </span>
                      <span className="inline-flex items-center gap-1" title={t('teacherClass.joinCode')}>
                        <Key size={12} strokeWidth={1.8} />
                        {cls.joinCode}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-soft)]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
