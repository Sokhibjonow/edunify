import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus, UserMinus, Copy, Check, KeyRound, LoaderCircle, Users, IdCard, CircleCheck, ArrowLeft } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import RemoveStudentConfirm from '@/components/classroom/RemoveStudentConfirm'
import Spinner from '@/components/ui/Spinner'
import { ApiError } from '@/services/api'
import { useClassStudentsQuery } from '@/hooks/useClassStudentsQuery'
import { useAddStudentToClassMutation } from '@/hooks/useAddStudentToClassMutation'
import { useResetStudentPasswordMutation } from '@/hooks/useResetStudentPasswordMutation'
import { useStudentLookupQuery } from '@/hooks/useStudentLookupQuery'
import { useAddExistingStudentMutation } from '@/hooks/useAddExistingStudentMutation'
import { formatConnectCodeInput } from '@/utils/connectCode'
import type { StudentCredentials } from '@/types/teacherClass'

type Props = {
  classId: string
  className: string
  onClose: () => void
}

const fieldClass = 'w-full min-w-0 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:outline-none'

export default function ClassStudentsModal({ classId, className, onClose }: Props) {
  const { t } = useTranslation()
  const { data: students, isLoading, isError, refetch } = useClassStudentsQuery(classId)
  const add = useAddStudentToClassMutation(classId)
  const reset = useResetStudentPasswordMutation(classId)
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [issued, setIssued] = useState<StudentCredentials | null>(null)
  const [mode, setMode] = useState<'id' | 'create'>('id')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removedNote, setRemovedNote] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !surname.trim()) return
    add.mutate({ name, surname }, {
      onSuccess: (creds) => {
        setIssued(creds)
        setName('')
        setSurname('')
      },
    })
  }

  return (
    <Modal title={`${t('teacherClass.studentsTitle')} · ${className}`} onClose={onClose} className="max-w-md">
      <div className="flex max-h-[75vh] flex-col gap-3">
        {mode === 'id' ? (
          <>
            <AddByIdForm classId={classId} />
            <button
              type="button"
              onClick={() => setMode('create')}
              className="cursor-pointer self-start border-0 bg-transparent p-0 text-xs text-[var(--color-text-soft)] underline underline-offset-2 hover:text-[var(--color-text)]"
            >
              {t('teacherClass.noAccountCreate')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => { setMode('id'); setIssued(null) }}
              className="inline-flex cursor-pointer items-center gap-1 self-start border-0 bg-transparent p-0 text-xs text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
            >
              <ArrowLeft size={13} strokeWidth={1.8} />
              {t('teacherClass.backToAddById')}
            </button>
            <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
              <input className={fieldClass} placeholder={t('teacherClass.firstName')} value={name} onChange={(e) => setName(e.target.value)} aria-label={t('teacherClass.firstName')} />
              <input className={fieldClass} placeholder={t('teacherClass.lastName')} value={surname} onChange={(e) => setSurname(e.target.value)} aria-label={t('teacherClass.lastName')} />
              <button
                type="submit"
                disabled={!name.trim() || !surname.trim() || add.isPending}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-[var(--color-on-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {add.isPending ? <LoaderCircle size={16} strokeWidth={1.8} className="animate-spin" /> : <UserPlus size={16} strokeWidth={1.8} />}
                {t('teacherClass.addStudent')}
              </button>
            </form>
            {add.isError && <p className="text-sm text-[var(--color-error-text)]">{t('auth.genericError')}</p>}
          </>
        )}

        {issued && <CredentialsCard creds={issued} onDismiss={() => setIssued(null)} />}
        {removedNote && (
          <p className="inline-flex items-center gap-1.5 text-sm text-[var(--color-success-text)]">
            <CircleCheck size={15} strokeWidth={1.8} className="shrink-0" />
            {removedNote}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <Spinner />
          ) : isError ? (
            <div>
              <p className="text-sm text-[var(--color-error-text)]">{t('common.loadError')}</p>
              <button type="button" onClick={() => refetch()} className="mt-2 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm text-[var(--color-text)]">{t('common.retry')}</button>
            </div>
          ) : !students?.length ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users size={32} strokeWidth={1.4} className="text-[var(--color-text-soft)]" />
              <p className="text-sm text-[var(--color-text-soft)]">{t('teacherClass.noStudents')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)]">
              {students.map((s) => (
                <li key={s.uniqueId} className="flex flex-col gap-2 px-2.5 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-semibold text-[var(--color-primary)]">
                      {`${s.name[0] ?? ''}${s.surname[0] ?? ''}`.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--color-text-strong)]">{s.name} {s.surname}</p>
                      <p className="truncate text-xs text-[var(--color-text-soft)]">
                        <span className="font-mono">{s.uniqueId}</span> · {s.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={reset.isPending && reset.variables === s.uniqueId}
                      onClick={() => reset.mutate(s.uniqueId, { onSuccess: setIssued })}
                      title={t('teacherClass.newPassword')}
                      className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[var(--color-line)] bg-transparent px-2 py-1 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                    >
                      <KeyRound size={13} strokeWidth={1.8} />
                      {t('teacherClass.newPassword')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRemovingId(s.uniqueId); setRemovedNote(null) }}
                      aria-label={t('removeStudent.remove')}
                      title={t('removeStudent.remove')}
                      className="shrink-0 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent p-1 text-[var(--color-text-soft)] hover:text-[var(--color-error-text)]"
                    >
                      <UserMinus size={15} strokeWidth={1.8} />
                    </button>
                  </div>
                  {removingId === s.uniqueId && (
                    <RemoveStudentConfirm
                      classId={classId}
                      className={className}
                      studentId={s.uniqueId}
                      studentName={`${s.name} ${s.surname}`}
                      onCancel={() => setRemovingId(null)}
                      onRemoved={(note) => { setRemovingId(null); setRemovedNote(note) }}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}

function AddByIdForm({ classId }: { classId: string }) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [addedName, setAddedName] = useState<string | null>(null)
  const lookup = useStudentLookupQuery(classId, code)
  const link = useAddExistingStudentMutation(classId)

  const lookupError = lookup.error instanceof ApiError
    ? lookup.error.status === 404
      ? t('teacherClass.lookupNotFound')
      : lookup.error.status === 403
        ? t('teacherClass.lookupOtherOrg')
        : t('auth.genericError')
    : lookup.isError ? t('auth.genericError') : null

  function onAdd() {
    if (!lookup.data) return
    const fullName = `${lookup.data.name} ${lookup.data.surname}`
    link.mutate(lookup.data.uniqueId, {
      onSuccess: () => {
        setAddedName(fullName)
        setCode('')
      },
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="student-id-input" className="text-sm text-[var(--color-text)]">{t('teacherClass.studentId')}</label>
      <div className="relative">
        <IdCard size={16} strokeWidth={1.8} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)]" />
        <input
          id="student-id-input"
          value={code}
          onChange={(e) => { setCode(formatConnectCodeInput(e.target.value)); setAddedName(null); link.reset() }}
          placeholder="XXX-XXX-XXX"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          className={`${fieldClass} pl-8 font-mono tracking-wider`}
        />
      </div>
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
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--color-text-strong)]">{lookup.data.name} {lookup.data.surname}</p>
            <p className="font-mono text-xs text-[var(--color-text-soft)]">{lookup.data.uniqueId}</p>
          </div>
          {lookup.data.alreadyInClass ? (
            <span className="shrink-0 text-xs text-[var(--color-text-soft)]">{t('teacherClass.alreadyInClass')}</span>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              disabled={link.isPending}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-on-primary)] disabled:opacity-50"
            >
              {link.isPending ? <LoaderCircle size={15} strokeWidth={1.8} className="animate-spin" /> : <UserPlus size={15} strokeWidth={1.8} />}
              {t('teacherClass.addToClass')}
            </button>
          )}
        </div>
      )}
      {link.isError && <p className="text-sm text-[var(--color-error-text)]">{t('auth.genericError')}</p>}

      {addedName && (
        <p className="inline-flex items-center gap-1.5 text-sm text-[var(--color-success-text)]">
          <CircleCheck size={15} strokeWidth={1.8} />
          {t('teacherClass.addedToClass', { name: addedName })}
        </p>
      )}
    </div>
  )
}

function CredentialsCard({ creds, onDismiss }: { creds: StudentCredentials; onDismiss: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3">
      <p className="text-sm font-semibold text-[var(--color-success-text)]">
        {t('teacherClass.credentialsFor', { name: `${creds.student.name} ${creds.student.surname}` })}
      </p>
      <div className="mt-2 flex flex-col gap-1.5">
        <CopyRow label={t('teacherClass.login')} value={creds.login} />
        <CopyRow label={t('teacherClass.password')} value={creds.password} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--color-text-soft)]">{t('teacherClass.credentialsHint')}</p>
        <button type="button" onClick={onDismiss} className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-[var(--color-success-text)]">
          {t('teacherClass.done')}
        </button>
      </div>
    </div>
  )
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(value).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => setCopied(false),
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface-top)] px-2.5 py-1.5">
      <span className="w-16 shrink-0 text-xs text-[var(--color-text-soft)]">{label}</span>
      <code className="min-w-0 flex-1 truncate font-mono text-sm text-[var(--color-text-strong)] select-all">{value}</code>
      <button type="button" onClick={copy} aria-label={t('teacherClass.copy')} className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[var(--color-text-soft)]">
        {copied ? <Check size={15} strokeWidth={2} className="text-[var(--color-success-text)]" /> : <Copy size={15} strokeWidth={1.8} />}
      </button>
    </div>
  )
}
