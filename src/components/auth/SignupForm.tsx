import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Phone, Mail, Lock, LoaderCircle, Building2 } from 'lucide-react'
import { useSignupMutation } from '@/hooks/useSignupMutation'
import { ApiError } from '@/services/api'
import { directorSignupInputSchema, signupInputSchema } from '@/schemas/authSchemas'
import type { SignupRole } from '@/types/auth'

const fieldWrap = 'relative'
const iconClass =
  'pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)]'
const inputClass =
  'w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] py-1.5 pl-8 pr-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-line-strong)]'
const errorTextClass = 'text-sm font-normal text-[var(--color-error-text)]'

const EMPTY_FORM = {
  name: '',
  surname: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  organizationName: '',
}

type Field = keyof typeof EMPTY_FORM
type Props = { role: SignupRole }

export default function SignupForm({ role }: Props) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY_FORM)
  const [mismatch, setMismatch] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const mutation = useSignupMutation(role)
  const isDirector = role === 'director'

  const setField = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (mismatch && (field === 'password' || field === 'confirmPassword')) setMismatch(false)
    if (validationError) setValidationError(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (mutation.isPending) return
    if (form.password !== form.confirmPassword) {
      setMismatch(true)
      return
    }

    const payload = {
      name: form.name,
      surname: form.surname,
      phone: form.phone,
      email: form.email,
      password: form.password,
      ...(isDirector ? { organizationName: form.organizationName } : {}),
    }

    const parsed = isDirector
      ? directorSignupInputSchema.safeParse(payload)
      : signupInputSchema.safeParse(payload)

    if (!parsed.success) {
      setValidationError(t('auth.required'))
      return
    }

    mutation.mutate(parsed.data)
  }

  const formError = mutation.isError
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : t('auth.genericError')
    : validationError

  return (
    <form onSubmit={handleSubmit} className="signup-form flex flex-col gap-2">
      <div className={fieldWrap}>
        <User size={18} strokeWidth={1.8} className={iconClass} />
        <input
          required
          value={form.name}
          onChange={setField('name')}
          placeholder={t('auth.name')}
          aria-label={t('auth.name')}
          className={inputClass}
        />
      </div>
      <div className={fieldWrap}>
        <User size={18} strokeWidth={1.8} className={iconClass} />
        <input
          required
          value={form.surname}
          onChange={setField('surname')}
          placeholder={t('auth.surname')}
          aria-label={t('auth.surname')}
          className={inputClass}
        />
      </div>
      {isDirector && (
        <div className={fieldWrap}>
          <Building2 size={18} strokeWidth={1.8} className={iconClass} />
          <input
            required
            value={form.organizationName}
            onChange={setField('organizationName')}
            placeholder={t('auth.organizationName')}
            aria-label={t('auth.organizationName')}
            className={inputClass}
          />
        </div>
      )}
      <div className={fieldWrap}>
        <Phone size={18} strokeWidth={1.8} className={iconClass} />
        <input
          type="tel"
          required
          value={form.phone}
          onChange={setField('phone')}
          placeholder={t('auth.phoneNumber')}
          aria-label={t('auth.phoneNumber')}
          className={inputClass}
        />
      </div>
      <div className={fieldWrap}>
        <Mail size={18} strokeWidth={1.8} className={iconClass} />
        <input
          type="email"
          required
          value={form.email}
          onChange={setField('email')}
          placeholder={t('auth.email')}
          aria-label={t('auth.email')}
          className={inputClass}
        />
      </div>
      <div className={fieldWrap}>
        <Lock size={18} strokeWidth={1.8} className={iconClass} />
        <input
          type="password"
          required
          value={form.password}
          onChange={setField('password')}
          placeholder={t('auth.password')}
          aria-label={t('auth.password')}
          className={inputClass}
        />
      </div>
      <div className={fieldWrap}>
        <Lock size={18} strokeWidth={1.8} className={iconClass} />
        <input
          type="password"
          required
          value={form.confirmPassword}
          onChange={setField('confirmPassword')}
          placeholder={t('auth.confirmPassword')}
          aria-label={t('auth.confirmPassword')}
          className={inputClass}
        />
      </div>

      {mismatch && <p className={errorTextClass}>{t('auth.passwordMismatch')}</p>}
      {formError && <p className={errorTextClass}>{formError}</p>}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-1 flex cursor-pointer items-center justify-center rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-2.5 py-1.5 text-sm font-normal text-[var(--color-on-primary)] disabled:cursor-default disabled:opacity-70"
      >
        {mutation.isPending ? (
          <LoaderCircle size={18} strokeWidth={1.8} className="animate-spin text-[var(--color-on-primary)]" />
        ) : (
          t('auth.signUp')
        )}
      </button>
    </form>
  )
}
