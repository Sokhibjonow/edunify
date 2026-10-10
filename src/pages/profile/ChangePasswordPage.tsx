import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppHeader from '@/components/layout/AppHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useChangePasswordMutation } from '@/hooks/useChangePasswordMutation'

export default function ChangePasswordPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const mutation = useChangePasswordMutation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ currentPassword?: string; newPassword?: string }>({})

  if (!user) return <Navigate to="/" replace />

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (mutation.isPending) return

    const errors: { currentPassword?: string; newPassword?: string } = {}
    if (!currentPassword) errors.currentPassword = t('auth.required')
    if (!newPassword) errors.newPassword = t('auth.required')
    setFieldErrors(errors)
    if (errors.currentPassword || errors.newPassword) return

    mutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('')
          setNewPassword('')
        },
      },
    )
  }

  return (
    <>
      <AppHeader />
      <main className="change-password-page mx-auto max-w-sm p-3">
        <Card className="change-password-card">
          <h1 className="text-base font-normal text-[var(--color-text)]">{t('profile.changePassword')}</h1>
          <form className="change-password-form mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
            <Input
              label={t('profile.currentPassword')}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={fieldErrors.currentPassword}
              autoComplete="current-password"
            />
            <Input
              label={t('profile.newPassword')}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={fieldErrors.newPassword}
              autoComplete="new-password"
            />
            <Button type="submit" disabled={mutation.isPending}>
              {t('profile.save')}
            </Button>
          </form>
        </Card>
      </main>
    </>
  )
}
