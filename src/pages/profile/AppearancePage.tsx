import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppHeader from '@/components/layout/AppHeader'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import LogoSection from '@/components/appearance/LogoSection'
import LightThemeSection from '@/components/appearance/LightThemeSection'
import DarkThemeSection from '@/components/appearance/DarkThemeSection'
import { useOrganizationQuery } from '@/hooks/useOrganizationQuery'
import { useUpdateOrganizationThemeMutation } from '@/hooks/useUpdateOrganizationThemeMutation'
import { useUpdateOrganizationLogoMutation } from '@/hooks/useUpdateOrganizationLogoMutation'
import { useAuthStore } from '@/stores/authStore'
import { hexColorSchema } from '@/schemas/themeSchemas'
import { appearanceTokenI18nKey } from '@/utils/appearanceTokens'
import type { Theme } from '@/types'
import type { ThemeColors } from '@/types/theme'

type EditTarget = { mode: Theme; token: keyof ThemeColors }

export default function AppearancePage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const orgId = useAuthStore((s) => s.organizationId)
  const { data: org, isLoading, isError, refetch } = useOrganizationQuery(orgId)
  const updateTheme = useUpdateOrganizationThemeMutation(orgId ?? '')
  const updateLogo = useUpdateOrganizationLogoMutation(orgId ?? '')
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [hexValue, setHexValue] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()

  if (!user || user.role !== 'director') return <Navigate to="/profile" replace />

  const openEdit = (mode: Theme, token: keyof ThemeColors, current: string) => {
    setEditTarget({ mode, token })
    setHexValue(current)
    setFieldError(undefined)
  }

  const closeEdit = () => {
    setEditTarget(null)
    setHexValue('')
    setFieldError(undefined)
  }

  const handleSave = () => {
    if (!editTarget || !org) return
    const parsed = hexColorSchema.safeParse(hexValue.trim())
    if (!parsed.success) {
      setFieldError(t('appearance.invalidHex'))
      return
    }

    const modeKey = editTarget.mode === 'light' ? 'lightTheme' : 'darkTheme'
    const nextTheme = { ...org[modeKey], [editTarget.token]: parsed.data }

    updateTheme.mutate({ [modeKey]: nextTheme }, { onSuccess: () => closeEdit() })
  }

  return (
    <>
      <AppHeader />
      <main className="appearance-page mx-auto max-w-sm p-3">
        <div className="appearance-content my-3">
          {isLoading ? (
            <Spinner />
          ) : isError ? (
            <Card>
              <p className="text-sm font-normal text-[var(--color-error-text)]">{t('common.loadError')}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)]"
              >
                {t('common.retry')}
              </button>
            </Card>
          ) : org ? (
            <>
              <LogoSection
                logoUrl={org.logoUrl}
                isUploading={updateLogo.isPending}
                onFileSelect={(file) => updateLogo.mutate(file)}
              />
              <LightThemeSection
                colors={org.lightTheme}
                onEditToken={(token, current) => openEdit('light', token, current)}
              />
              <DarkThemeSection
                colors={org.darkTheme}
                onEditToken={(token, current) => openEdit('dark', token, current)}
              />
            </>
          ) : (
            <p className="text-sm font-normal text-[var(--color-text-soft)]">{t('common.empty')}</p>
          )}
        </div>
      </main>

      {editTarget && (
        <Modal title={t(appearanceTokenI18nKey(editTarget.token))} onClose={closeEdit} className="appearance-color-modal">
          <form
            className="appearance-color-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            <Input
              label={t(appearanceTokenI18nKey(editTarget.token))}
              value={hexValue}
              onChange={(e) => {
                setHexValue(e.target.value)
                setFieldError(undefined)
              }}
              error={fieldError}
              autoComplete="off"
              spellCheck={false}
            />
            <div className="mt-3">
              <Button type="submit" disabled={updateTheme.isPending}>
                {t('appearance.save')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
