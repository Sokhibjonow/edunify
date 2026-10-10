import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AUTH_ROUTE_TITLE_KEYS } from '@/routes/pageTitles'

/** Translated page title for the current authenticated route, or null on home. */
export function useRoutePageTitle(): string | null {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const key = AUTH_ROUTE_TITLE_KEYS[pathname]
  if (key === undefined || key === null) return null
  return t(key)
}
