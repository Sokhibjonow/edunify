import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, School, Users } from 'lucide-react'
import ManagerHeader from '@/components/layout/ManagerHeader'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import UserIdCard from '@/components/ui/UserIdCard'
import { useAuthStore } from '@/stores/authStore'
import { useStudentClassesQuery } from '@/hooks/useStudentClassesQuery'

export default function StudentHomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)!
  const { data: classes, isLoading, isError, refetch } = useStudentClassesQuery(user.uniqueId)
  const hasClasses = !!classes?.length

  return (
    <>
      <ManagerHeader />
      <main className="student-home-page mx-auto flex max-w-md flex-col gap-3 p-3">
        <h1 className="text-[15px] font-semibold text-[var(--color-text-strong)]">
          {t('home.welcome', { name: user.name })}
        </h1>

        <UserIdCard
          uniqueId={user.uniqueId}
          label={t('studentClass.yourId')}
          prominent={!isLoading && !isError && !hasClasses}
          hint={!isLoading && !isError && !hasClasses ? t('studentClass.idHintNoClass') : t('studentClass.idHint')}
        />

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('studentClass.myClasses')}</h2>
          {isLoading ? (
            <Spinner />
          ) : isError ? (
            <Card>
              <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
              <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
            </Card>
          ) : !hasClasses ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--color-line-strong)] px-3 py-8 text-center">
              <School size={32} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
              <p className="text-sm text-[var(--color-text-soft)]">{t('studentClass.noClasses')}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {classes.map((cls) => (
                <li key={cls.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/classes/${cls.id}`)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-left hover:bg-[var(--color-surface-hover)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-[var(--color-text-strong)]">{cls.name}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-text-soft)]">
                        <Users size={12} strokeWidth={1.8} />
                        {cls.studentIds.length} {t('teacherClass.students')}
                      </p>
                    </div>
                    <ChevronRight size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-soft)]" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
