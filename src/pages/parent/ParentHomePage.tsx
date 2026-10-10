import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Layers, UsersRound } from 'lucide-react'
import ManagerHeader from '@/components/layout/ManagerHeader'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import UserIdCard from '@/components/ui/UserIdCard'
import { useAuthStore } from '@/stores/authStore'
import { useParentChildrenQuery } from '@/hooks/useParent'

export default function ParentHomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)!
  const { data: children, isLoading, isError, refetch } = useParentChildrenQuery(user.uniqueId)
  const waiting = !isLoading && !isError && !children?.length

  return (
    <>
      <ManagerHeader />
      <main className="parent-home-page mx-auto flex max-w-md flex-col gap-3 p-3">
        <h1 className="text-[15px] font-semibold text-[var(--color-text-strong)]">{t('home.welcome', { name: user.name })}</h1>

        <UserIdCard
          uniqueId={user.uniqueId}
          label={t('parent.yourId')}
          prominent={waiting}
          hint={waiting ? t('parent.idHintNoChild') : t('parent.idHint')}
        />

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('parent.children')}</h2>
          {isLoading ? (
            <Spinner />
          ) : isError ? (
            <Card>
              <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
              <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
            </Card>
          ) : !children?.length ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--color-line-strong)] px-3 py-8 text-center">
              <UsersRound size={32} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
              <p className="text-sm text-[var(--color-text-soft)]">{t('parent.noChildren')}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {children.map((child) => (
                <li key={child.uniqueId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/children/${child.uniqueId}`)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-left hover:bg-[var(--color-surface-hover)]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-primary)]">
                      {`${child.name[0] ?? ''}${child.surname[0] ?? ''}`.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-[var(--color-text-strong)]">{child.name} {child.surname}</p>
                      <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-[var(--color-text-soft)]">
                        <Layers size={12} strokeWidth={1.8} className="shrink-0" />
                        {child.classes.length ? child.classes.map((c) => c.name).join(', ') : t('parent.noClasses')}
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
