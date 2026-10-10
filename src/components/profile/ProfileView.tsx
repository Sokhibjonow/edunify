import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { KeyRound, LogOut, Palette, Pencil } from 'lucide-react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/hooks/useLogout'
import { useProfileQuery } from '@/hooks/useProfileQuery'
import { useUpdateProfileMutation } from '@/hooks/useUpdateProfileMutation'
import { profilePatchInputSchema } from '@/schemas/profileSchemas'

const actionButtonClass =
  'flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)]'

type FieldErrors = {
  name?: string
  surname?: string
  email?: string
  phone?: string
}

const fieldErrorKey = (field: keyof FieldErrors): string => {
  const keys: Record<keyof FieldErrors, string> = {
    name: 'profile.validation.name',
    surname: 'profile.validation.surname',
    email: 'profile.validation.email',
    phone: 'profile.validation.phone',
  }
  return keys[field]
}

export default function ProfileView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const { data: profile, isLoading, isError, refetch } = useProfileQuery()
  const updateProfile = useUpdateProfileMutation()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (profile && !editing) {
      setName(profile.name)
      setSurname(profile.surname)
      setEmail(profile.email)
      setPhone(profile.phone)
    }
  }, [profile, editing])

  if (!user) return null

  const isDirector = user.role === 'director'

  const resetForm = () => {
    if (!profile) return
    setName(profile.name)
    setSurname(profile.surname)
    setEmail(profile.email)
    setPhone(profile.phone)
    setFieldErrors({})
  }

  const startEdit = () => {
    resetForm()
    setEditing(true)
  }

  const cancelEdit = () => {
    resetForm()
    setEditing(false)
  }

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSave = () => {
    const parsed = profilePatchInputSchema.safeParse({ name, surname, email, phone })
    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'name' || key === 'surname' || key === 'email' || key === 'phone') {
          next[key] = t(fieldErrorKey(key))
        }
      }
      setFieldErrors(next)
      return
    }

    updateProfile.mutate(parsed.data, { onSuccess: () => setEditing(false) })
  }

  return (
    <main className="profile-page mx-auto max-w-sm p-3">
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Card className="profile-card">
          <p className="text-sm font-normal text-[var(--color-error-text)]">{t('common.loadError')}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)]"
          >
            {t('common.retry')}
          </button>
        </Card>
      ) : profile ? (
        <Card className="profile-card">
          <div className="profile-header flex items-start justify-between gap-2">
            {profile.organizationName ? (
              <h1 className="profile-organization text-base font-normal text-[var(--color-text)]">
                {profile.organizationName}
              </h1>
            ) : (
              <span />
            )}
            {!editing && (
              <button
                type="button"
                onClick={startEdit}
                className="profile-edit inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[var(--color-line)] bg-transparent px-2 py-1 text-sm font-normal text-[var(--color-text)]"
              >
                <Pencil size={16} strokeWidth={1.8} className="text-[var(--color-text)]" />
                {t('profile.edit')}
              </button>
            )}
          </div>

          <section className="profile-information mt-4">
            <h2 className="mb-3 text-sm font-normal text-[var(--color-text-soft)]">
              {t('profile.information')}
            </h2>
            <dl className="profile-details flex flex-col gap-3">
              <div>
                {editing ? (
                  <Input
                    label={t('profile.name')}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      clearFieldError('name')
                    }}
                    error={fieldErrors.name}
                    autoComplete="given-name"
                  />
                ) : (
                  <>
                    <dt className="text-sm font-normal text-[var(--color-text-soft)]">
                      {t('profile.name')}
                    </dt>
                    <dd className="text-sm font-normal text-[var(--color-text)]">{profile.name}</dd>
                  </>
                )}
              </div>
              <div>
                {editing ? (
                  <Input
                    label={t('profile.surname')}
                    value={surname}
                    onChange={(e) => {
                      setSurname(e.target.value)
                      clearFieldError('surname')
                    }}
                    error={fieldErrors.surname}
                    autoComplete="family-name"
                  />
                ) : (
                  <>
                    <dt className="text-sm font-normal text-[var(--color-text-soft)]">
                      {t('profile.surname')}
                    </dt>
                    <dd className="text-sm font-normal text-[var(--color-text)]">{profile.surname}</dd>
                  </>
                )}
              </div>
              <div>
                {editing ? (
                  <Input
                    label={t('profile.email')}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      clearFieldError('email')
                    }}
                    error={fieldErrors.email}
                    autoComplete="email"
                  />
                ) : (
                  <>
                    <dt className="text-sm font-normal text-[var(--color-text-soft)]">
                      {t('profile.email')}
                    </dt>
                    <dd className="text-sm font-normal text-[var(--color-text)]">{profile.email}</dd>
                  </>
                )}
              </div>
              <div>
                {editing ? (
                  <Input
                    label={t('profile.phoneNumber')}
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      clearFieldError('phone')
                    }}
                    error={fieldErrors.phone}
                    autoComplete="tel"
                  />
                ) : (
                  <>
                    <dt className="text-sm font-normal text-[var(--color-text-soft)]">
                      {t('profile.phoneNumber')}
                    </dt>
                    <dd className="text-sm font-normal text-[var(--color-text)]">{profile.phone}</dd>
                  </>
                )}
              </div>
              <div>
                <dt className="text-sm font-normal text-[var(--color-text-soft)]">
                  {t('profile.uniqueId')}
                </dt>
                <dd className="text-sm font-normal text-[var(--color-text)]">
                  ID: {profile.uniqueId}
                </dd>
              </div>
            </dl>

            {editing && (
              <div className="profile-edit-actions mt-4 flex flex-col gap-2">
                <Button type="button" onClick={handleSave} disabled={updateProfile.isPending}>
                  {t('profile.save')}
                </Button>
                <Button type="button" variant="secondary" onClick={cancelEdit} disabled={updateProfile.isPending}>
                  {t('profile.cancel')}
                </Button>
              </div>
            )}
          </section>

          {!editing && (
            <section className="profile-actions mt-6">
              <h2 className="mb-3 text-sm font-normal text-[var(--color-text-soft)]">
                {t('profile.accountActions')}
              </h2>
              <div className="flex flex-col gap-2">
                {isDirector && (
                  <button
                    type="button"
                    onClick={() => navigate('/home/appearance')}
                    className={actionButtonClass}
                  >
                    <Palette size={18} strokeWidth={1.8} className="text-[var(--color-text)]" />
                    {t('profile.appearance')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/profile/change-password')}
                  className={actionButtonClass}
                >
                  <KeyRound size={18} strokeWidth={1.8} className="text-[var(--color-text)]" />
                  {t('profile.changePassword')}
                </button>
                <button type="button" onClick={logout} className={actionButtonClass}>
                  <LogOut size={18} strokeWidth={1.8} className="text-[var(--color-text)]" />
                  {t('profile.logout')}
                </button>
              </div>
            </section>
          )}
        </Card>
      ) : null}
    </main>
  )
}
