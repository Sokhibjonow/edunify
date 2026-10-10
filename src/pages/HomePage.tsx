import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDocumentBranding } from '@/hooks/useDocumentBranding'
import { ROLES } from '@/routes/roles'

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  useDocumentBranding(t('home.pageTitle'))

  return (
    <div className="role-selection-page mx-auto flex max-w-sm flex-col gap-2 p-3">
      <p className="text-sm font-normal text-[var(--color-text)]">{t('home.title')}</p>
      {ROLES.map((role) => (
        <button
          key={role.role}
          type="button"
          onClick={() => navigate(`/${role.slug}`)}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-sm font-normal text-[var(--color-text)]"
        >
          {t(`roles.${role.i18nKey}`)}
        </button>
      ))}
    </div>
  )
}
