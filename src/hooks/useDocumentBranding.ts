import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useActiveOrganizationBranding } from '@/hooks/useActiveOrganizationBranding'
import { useRoutePageTitle } from '@/hooks/useRoutePageTitle'
import { DEFAULT_FAVICON, setFavicon } from '@/utils/favicon'

/** Sets document.title and org-driven favicon. Pass pageName on public routes; auth routes derive it from the URL. */
export function useDocumentBranding(pageName?: string) {
  const { t } = useTranslation()
  const routeTitle = useRoutePageTitle()
  const { logoUrl } = useActiveOrganizationBranding()
  const documentTitle = pageName ?? routeTitle ?? t('home.pageTitle')

  useEffect(() => {
    document.title = documentTitle
  }, [documentTitle])

  useEffect(() => {
    setFavicon(logoUrl ?? DEFAULT_FAVICON)
  }, [logoUrl])
}
