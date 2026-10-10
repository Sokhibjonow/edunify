import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/stores/themeStore'
import HomeHeaderMenu from '@/components/layout/HomeHeaderMenu'
import { useActiveOrganizationBranding } from '@/hooks/useActiveOrganizationBranding'
import { useDocumentBranding } from '@/hooks/useDocumentBranding'
import { useRoutePageTitle } from '@/hooks/useRoutePageTitle'
import edunifyLogo from '@/assets/edunifyLogo.png'

export default function AppHeader() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const theme = useThemeStore((s) => s.theme)
  const pageTitle = useRoutePageTitle()
  const { name, logoUrl } = useActiveOrganizationBranding()

  useDocumentBranding()

  const displayName = name ?? t('app.name')
  const logoSrc = logoUrl ?? edunifyLogo
  const isFallbackLogo = !logoUrl

  const goHome = () => navigate('/home')

  return (
    <header className="app-header flex items-center justify-between gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface-top)] px-3 py-2.5">
      <div className="flex min-w-0 items-center">
        <button
          type="button"
          onClick={goHome}
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-transparent bg-transparent p-0 text-left"
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center ${
              isFallbackLogo && theme === 'dark' ? 'invert' : ''
            }`}
          >
            <img src={logoSrc} alt="" className="h-full w-full object-contain" />
          </div>
          <span className="truncate text-[15px] font-semibold text-[var(--color-text-strong)]">
            {displayName}
          </span>
        </button>
        {pageTitle && (
          <span className="min-w-0 truncate text-[15px] font-semibold text-[var(--color-text-strong)]">
            <span className="font-normal text-[var(--color-text-soft)]"> • </span>
            {pageTitle}
          </span>
        )}
      </div>

      <HomeHeaderMenu />
    </header>
  )
}
