import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Layers, Mail, Phone, Wallet, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import RemoveStudentConfirm from '@/components/classroom/RemoveStudentConfirm'
import StudentParentsSection from '@/components/students/StudentParentsSection'
import { attendanceTextClass } from '@/utils/attendanceColor'
import { formatAmount, formatMonth } from '@/utils/formatMoney'
import type { BranchStudent } from '@/types/branchStudent'

type Props = { orgId: string; branchId: string; student: BranchStudent; onClose: () => void }

function CopyValue({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  if (!value) return null
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={14} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-soft)]" />
      <span className="min-w-0 flex-1 select-all truncate text-[var(--color-text)]">{value}</span>
      <button
        type="button"
        aria-label={t('teacherClass.copy')}
        onClick={() => navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }, () => undefined)}
        className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[var(--color-text-soft)]"
      >
        {copied ? <Check size={14} strokeWidth={2} className="text-[var(--color-success-text)]" /> : <Copy size={14} strokeWidth={1.8} />}
      </button>
    </div>
  )
}

export default function StudentDetailModal({ orgId, branchId, student, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  // Keeps ?branch= so a director lands on the same branch's payments
  const location = useLocation()
  const a = student.attendance
  const money = (n: number) => formatAmount(n, i18n.language)
  const currency = t('payments.currency')
  const [removingClassId, setRemovingClassId] = useState<string | null>(null)
  const [removedNote, setRemovedNote] = useState<string | null>(null)
  const removing = student.classes.find((c) => c.id === removingClassId)

  return (
    <Modal title={`${student.name} ${student.surname}`} onClose={onClose} className="max-w-md">
      <div className="flex max-h-[75vh] flex-col gap-3 overflow-y-auto">
        <section className="flex flex-col gap-1.5">
          <p className="font-mono text-xs text-[var(--color-text-soft)]">ID {student.uniqueId}</p>
          <CopyValue icon={Phone} value={student.phone} />
          <CopyValue icon={Mail} value={student.email} />
        </section>

        <StudentParentsSection orgId={orgId} branchId={branchId} studentId={student.uniqueId} />

        <section className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-soft)]">{t('branchStudents.classes')}</h3>
          {!student.classes.length ? (
            <p className="text-sm text-[var(--color-text-soft)]">{t('removeStudent.leftAll')}</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {student.classes.map((c) => (
                <li key={c.id} className="inline-flex items-center gap-1 rounded-full border border-[var(--color-line)] py-0.5 pl-2 pr-1 text-xs text-[var(--color-text)]">
                  <Layers size={12} strokeWidth={1.8} />
                  {c.name}
                  <button
                    type="button"
                    onClick={() => { setRemovingClassId(c.id); setRemovedNote(null) }}
                    aria-label={`${t('removeStudent.remove')}: ${c.name}`}
                    title={t('removeStudent.remove')}
                    className="cursor-pointer rounded-full border-0 bg-transparent p-0.5 text-[var(--color-text-soft)] hover:text-[var(--color-error-text)]"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {removing && (
            <RemoveStudentConfirm
              classId={removing.id}
              className={removing.name}
              studentId={student.uniqueId}
              studentName={`${student.name} ${student.surname}`}
              onCancel={() => setRemovingClassId(null)}
              onRemoved={(note) => { setRemovingClassId(null); setRemovedNote(note) }}
            />
          )}
          {removedNote && (
            <p className="inline-flex items-center gap-1.5 text-sm text-[var(--color-success-text)]">
              <Check size={14} strokeWidth={2} className="shrink-0" />
              {removedNote}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-soft)]">{t('branchStudents.attendance30')}</h3>
          {a.total === 0 ? (
            <p className="text-sm text-[var(--color-text-soft)]">{t('branchStudents.noAttendance')}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums">
              <span className={`text-lg font-semibold ${attendanceTextClass(a.pct ?? 0)}`}>{a.pct}%</span>
              {(['present', 'late', 'absent', 'excused'] as const).map((k) => (
                <span key={k} className="text-xs text-[var(--color-text-soft)]">
                  {t(`attendance.${k}`)}: <span className="font-semibold text-[var(--color-text-strong)]">{a[k]}</span>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-soft)]">{t('branchStudents.payments')}</h3>
          {!student.unpaid.length ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-[var(--color-success-text)]">
              <Check size={14} strokeWidth={2} />
              {t('branchStudents.allPaid')}
            </p>
          ) : (
            <>
              <ul className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)]">
                {student.unpaid.map((l) => (
                  <li key={`${l.classId}|${l.period}`} className="flex items-center gap-2 px-2.5 py-1.5 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="capitalize text-[var(--color-text-strong)]">{formatMonth(l.period, i18n.language)}</span>
                      <span className="block truncate text-xs text-[var(--color-text-soft)]">{l.className}</span>
                    </span>
                    <span className={`shrink-0 font-semibold tabular-nums ${l.status === 'overdue' ? 'text-[var(--color-error-text)]' : 'text-[var(--color-text-strong)]'}`}>
                      {money(l.balance)} {currency}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => navigate({ pathname: '/payments', search: location.search }, { state: { month: student.unpaid[0].period } })}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 self-start rounded-lg border border-[var(--color-primary)] bg-transparent px-2.5 py-1.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-accent-soft)]"
              >
                <Wallet size={15} strokeWidth={1.8} />
                {t('branchStudents.toPayments')}
              </button>
            </>
          )}
        </section>
      </div>
    </Modal>
  )
}
