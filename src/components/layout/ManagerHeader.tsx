import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/stores/themeStore'
import HomeHeaderMenu from '@/components/layout/HomeHeaderMenu'
import { useActiveOrganizationBranding } from '@/hooks/useActiveOrganizationBranding'
import { useDocumentBranding } from '@/hooks/useDocumentBranding'
import { useRoutePageTitle } from '@/hooks/useRoutePageTitle'
import edunifyLogo from '@/assets/edunifyLogo.png'

/**
 * Manager-role header: transparent, 40×40 logo on the left, centered label,
 * and a rounded 40×40 menu on the right. Reuses the shared menu and branding.
 */
export default function ManagerHeader() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const theme = useThemeStore((s) => s.theme)
  const pageTitle = useRoutePageTitle()
  const { name, logoUrl } = useActiveOrganizationBranding()

  useDocumentBranding()

  const label = pageTitle ?? name ?? t('app.name')
  const logoSrc = logoUrl ?? edunifyLogo
  const isFallbackLogo = !logoUrl

  const goHome = () => navigate('/home')

  return (
    <header className="manager-header grid grid-cols-[40px_1fr_40px] items-center gap-2 bg-transparent px-3 py-2.5">
      <button
        type="button"
        onClick={goHome}
        aria-label={t('home.pageTitle')}
        className="manager-header-logo flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-transparent p-0"
      >
        <span
          className={`flex h-10 w-10 items-center justify-center ${
            isFallbackLogo && theme === 'dark' ? 'invert' : ''
          }`}
        >
          <img src={logoSrc} alt="" className="h-full w-full object-contain" />
        </span>
      </button>

      <span className="manager-header-label truncate text-center text-[15px] font-semibold text-[var(--color-text-strong)]">
        {label}
      </span>

      <HomeHeaderMenu triggerClassName="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[9999px] border border-[var(--color-line)] bg-transparent" />
    </header>
  )
}
