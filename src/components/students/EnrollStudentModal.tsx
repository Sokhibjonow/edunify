import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheck, IdCard, LoaderCircle, UserPlus } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { ApiError } from '@/services/api'
import { useBranchClassesQuery } from '@/hooks/useBranchClasses'
import { useBranchStudentLookupQuery, useEnrollBranchStudentMutation } from '@/hooks/useBranchStudents'
import { formatConnectCodeInput } from '@/utils/connectCode'

type Props = { orgId: string; branchId: string; onClose: () => void }

const field = 'w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:outline-none'

/** Enroll a self-registered student (by their ID) into a class of the branch. */
export default function EnrollStudentModal({ orgId, branchId, onClose }: Props) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [classId, setClassId] = useState('')
  const [added, setAdded] = useState<string | null>(null)
  const classes = useBranchClassesQuery(orgId, branchId)
  const lookup = useBranchStudentLookupQuery(orgId, branchId, code)
  const enroll = useEnrollBranchStudentMutation(orgId, branchId)

  const already = new Set(lookup.data?.classIds ?? [])
  const lookupError = lookup.error instanceof ApiError
    ? lookup.error.status === 404 ? t('teacherClass.lookupNotFound')
      : lookup.error.status === 403 ? t('teacherClass.lookupOtherOrg')
        : t('auth.genericError')
    : lookup.isError ? t('auth.genericError') : null
  const canSubmit = !!lookup.data && !!classId && !already.has(classId) && !enroll.isPending

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit || !lookup.data) return
    const name = `${lookup.data.name} ${lookup.data.surname}`
    const className = classes.data?.find((c) => c.id === classId)?.name ?? ''
    enroll.mutate({ uniqueId: lookup.data.uniqueId, classId }, {
      onSuccess: () => {
        setAdded(t('branchStudents.enrolled', { name, className }))
        setCode('')
        setClassId('')
      },
    })
  }

  return (
    <Modal title={t('branchStudents.addTitle')} onClose={onClose} className="max-w-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
        <label className="flex flex-col gap-1 text-sm text-[var(--color-text)]">
          {t('teacherClass.studentId')}
          <div className="relative">
            <IdCard size={16} strokeWidth={1.8} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)]" />
            <input
              autoFocus
              value={code}
              onChange={(e) => { setCode(formatConnectCodeInput(e.target.value)); setAdded(null); enroll.reset() }}
              placeholder="XXX-XXX-XXX"
              autoComplete="off"
              spellCheck={false}
              className={`${field} pl-8 font-mono tracking-wider`}
            />
          </div>
        </label>
        <p className="text-xs text-[var(--color-text-soft)]">{t('teacherClass.studentIdHint')}</p>

        {lookup.isFetching && (
          <p className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-soft)]">
            <LoaderCircle size={14} strokeWidth={1.8} className="animate-spin" />
            {t('teacherClass.lookupSearching')}
          </p>
        )}
        {!lookup.isFetching && lookupError && <p className="text-sm text-[var(--color-error-text)]">{lookupError}</p>}
        {!lookup.isFetching && lookup.data && (
          <div className="flex items-center gap-2.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-accent-soft)] px-2.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-top)] text-xs font-semibold text-[var(--color-primary)]">
              {`${lookup.data.name[0] ?? ''}${lookup.data.surname[0] ?? ''}`.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-text-strong)]">{lookup.data.name} {lookup.data.surname}</p>
              <p className="font-mono text-xs text-[var(--color-text-soft)]">{lookup.data.uniqueId}</p>
            </div>
          </div>
        )}

        {lookup.data && (
          <label className="flex flex-col gap-1 text-sm text-[var(--color-text)]">
            {t('payments.class')}
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={field}>
              <option value="">{t('branchStudents.chooseClass')}</option>
              {(classes.data ?? []).map((c) => (
                <option key={c.id} value={c.id} disabled={already.has(c.id)}>
                  {c.name}{already.has(c.id) ? ` · ${t('teacherClass.alreadyInClass')}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        {enroll.isError && <p className="text-sm text-[var(--color-error-text)]">{t('auth.genericError')}</p>}
        {added && (
          <p className="inline-flex items-center gap-1.5 text-sm text-[var(--color-success-text)]">
            <CircleCheck size={15} strokeWidth={1.8} />
            {added}
          </p>
        )}

        <div className="mt-1 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent py-1.5 text-sm text-[var(--color-text)]">
            {added ? t('teacherClass.done') : t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] py-1.5 text-sm font-semibold text-[var(--color-on-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enroll.isPending ? <LoaderCircle size={15} strokeWidth={1.8} className="animate-spin" /> : <UserPlus size={15} strokeWidth={1.8} />}
            {t('teacherClass.addToClass')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
