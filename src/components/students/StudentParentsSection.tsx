import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { IdCard, LoaderCircle, Phone, UserPlus, X } from 'lucide-react'
import { ApiError } from '@/services/api'
import { useLinkParentMutation, useParentLookupQuery, useStudentParentsQuery, useUnlinkParentMutation } from '@/hooks/useParent'
import { formatConnectCodeInput } from '@/utils/connectCode'

type Props = { orgId: string; branchId: string; studentId: string }

/** Staff link a parent (by the parent's own ID) so they can follow this student. */
export default function StudentParentsSection({ orgId, branchId, studentId }: Props) {
  const { t } = useTranslation()
  const parents = useStudentParentsQuery(orgId, branchId, studentId)
  const link = useLinkParentMutation(orgId, branchId, studentId)
  const unlink = useUnlinkParentMutation(orgId, branchId, studentId)
  const [adding, setAdding] = useState(false)
  const [code, setCode] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const lookup = useParentLookupQuery(orgId, branchId, code)

  const alreadyLinked = !!lookup.data && (parents.data ?? []).some((p) => p.uniqueId === lookup.data!.uniqueId)
  const lookupError = lookup.error instanceof ApiError && lookup.error.status === 404 ? t('parent.lookupNotFound') : lookup.isError ? t('auth.genericError') : null

  function onLink(e: FormEvent) {
    e.preventDefault()
    if (!lookup.data || alreadyLinked) return
    link.mutate(lookup.data.uniqueId, { onSuccess: () => { setCode(''); setAdding(false) } })
  }

  return (
    <section className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-soft)]">{t('parent.parents')}</h3>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs font-semibold text-[var(--color-primary)]">
            <UserPlus size={13} strokeWidth={1.8} />
            {t('parent.addParent')}
          </button>
        )}
      </div>

      {parents.isLoading ? (
        <LoaderCircle size={16} strokeWidth={1.8} className="animate-spin text-[var(--color-text-soft)]" />
      ) : parents.isError ? (
        <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
      ) : !parents.data?.length && !adding ? (
        <p className="text-sm text-[var(--color-text-soft)]">{t('parent.noParents')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {(parents.data ?? []).map((p) => (
            <li key={p.uniqueId} className="flex items-center gap-2 rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[var(--color-text-strong)]">{p.name} {p.surname}</span>
                {p.phone && (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-soft)]">
                    <Phone size={11} strokeWidth={1.8} />
                    <span className="select-all">{p.phone}</span>
                  </span>
                )}
              </span>
              {confirmId === p.uniqueId ? (
                <span className="inline-flex shrink-0 items-center gap-1.5">
                  <button type="button" onClick={() => setConfirmId(null)} className="cursor-pointer border-0 bg-transparent p-0 text-xs text-[var(--color-text-soft)]">{t('common.cancel')}</button>
                  <button
                    type="button"
                    disabled={unlink.isPending}
                    onClick={() => unlink.mutate(p.uniqueId, { onSuccess: () => setConfirmId(null) })}
                    className="cursor-pointer rounded-md border-0 bg-[var(--color-error)] px-2 py-0.5 text-xs font-semibold text-[var(--color-on-primary)] disabled:opacity-50"
                  >
                    {t('parent.unlink')}
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmId(p.uniqueId)} aria-label={t('parent.unlink')} title={t('parent.unlink')} className="shrink-0 cursor-pointer border-0 bg-transparent p-0.5 text-[var(--color-text-soft)] hover:text-[var(--color-error-text)]">
                  <X size={14} strokeWidth={1.8} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <form onSubmit={onLink} className="flex flex-col gap-1.5 rounded-md bg-[var(--color-surface-hover)] p-2">
          <div className="relative">
            <IdCard size={15} strokeWidth={1.8} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)]" />
            <input
              autoFocus
              value={code}
              onChange={(e) => { setCode(formatConnectCodeInput(e.target.value)); link.reset() }}
              placeholder={t('parent.parentIdPlaceholder')}
              aria-label={t('parent.parentIdPlaceholder')}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] py-1.5 pl-8 pr-2.5 font-mono text-sm tracking-wider text-[var(--color-text)] placeholder:font-sans placeholder:tracking-normal placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          {lookup.isFetching && <p className="text-xs text-[var(--color-text-soft)]">{t('teacherClass.lookupSearching')}</p>}
          {!lookup.isFetching && lookupError && <p className="text-xs text-[var(--color-error-text)]">{lookupError}</p>}
          {!lookup.isFetching && lookup.data && (
            <p className="text-sm text-[var(--color-text-strong)]">
              {lookup.data.name} {lookup.data.surname}
              {alreadyLinked && <span className="ml-1.5 text-xs text-[var(--color-text-soft)]">· {t('parent.alreadyLinked')}</span>}
            </p>
          )}
          {link.isError && <p className="text-xs text-[var(--color-error-text)]">{t('auth.genericError')}</p>}
          <p className="text-xs text-[var(--color-text-soft)]">{t('parent.linkHint')}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setAdding(false); setCode('') }} className="flex-1 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent py-1 text-sm text-[var(--color-text)]">{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={!lookup.data || alreadyLinked || link.isPending}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] py-1 text-sm font-semibold text-[var(--color-on-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {link.isPending && <LoaderCircle size={14} strokeWidth={1.8} className="animate-spin" />}
              {t('parent.link')}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
