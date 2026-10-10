import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import AppHeader from '@/components/layout/AppHeader'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery'
import { useOrganizationQuery } from '@/hooks/useOrganizationQuery'
import { useAuthStore } from '@/stores/authStore'

type Props = {
  i18nKey: string
  showOrganizationName?: boolean
  /** Header component to render. Defaults to the shared `AppHeader`. */
  header?: ComponentType
}

export default function RoleHome({
  i18nKey,
  showOrganizationName = false,
  header: Header = AppHeader,
}: Props) {
  const { t } = useTranslation()
  const { data: user, isLoading, isError, refetch } = useCurrentUserQuery()
  const orgId = useAuthStore((s) => s.organizationId)
  const { data: org } = useOrganizationQuery(showOrganizationName ? orgId : null)

  return (
    <>
      <Header />
      <main className="role-home-page mx-auto max-w-sm p-3">
        <h1 className="text-[15px] font-semibold text-[var(--color-text-strong)]">
          {t(`roles.${i18nKey}`)}
        </h1>

        <div className="role-home-content my-3">
          {isLoading ? (
            <Spinner />
          ) : isError ? (
            <Card>
              <p className="text-sm font-normal text-[var(--color-error-text)]">
                {t('common.loadError')}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)]"
              >
                {t('common.retry')}
              </button>
            </Card>
          ) : user ? (
            <Card className="role-home-welcome-card">
              {showOrganizationName && org && (
                <p className="text-sm font-semibold text-[var(--color-text-strong)]">{org.name}</p>
              )}
              <p
                className={`text-sm font-normal text-[var(--color-text)] ${
                  showOrganizationName && org ? 'mt-2' : ''
                }`}
              >
                {t('home.welcome', { name: user.name })}
              </p>
            </Card>
          ) : (
            <p className="text-sm font-normal text-[var(--color-text-soft)]">{t('common.empty')}</p>
          )}
        </div>
      </main>
    </>
  )
}
