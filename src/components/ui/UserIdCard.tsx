import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, IdCard } from 'lucide-react'

type Props = {
  uniqueId: string
  label: string
  hint: string
  /** Larger and highlighted while the user still has to hand this ID to someone. */
  prominent: boolean
}

/** A user's own Connect Code with a copy button: what students and parents give to staff. */
export default function UserIdCard({ uniqueId, label, hint, prominent }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(uniqueId).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => setCopied(false),
    )
  }

  return (
    <section
      className={`flex flex-col gap-1.5 rounded-lg border p-3 ${
        prominent ? 'border-[var(--color-primary)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-line)]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <IdCard size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-primary)]" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--color-text-soft)]">{label}</p>
          <p className={`select-all font-mono font-semibold tracking-wider text-[var(--color-text-strong)] ${prominent ? 'text-xl' : 'text-base'}`}>
            {uniqueId}
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] px-2.5 py-1.5 text-sm text-[var(--color-text)]"
        >
          {copied ? <Check size={15} strokeWidth={2} className="text-[var(--color-success-text)]" /> : <Copy size={15} strokeWidth={1.8} />}
          {copied ? t('studentClass.copied') : t('teacherClass.copy')}
        </button>
      </div>
      <p className="text-xs text-[var(--color-text-soft)]">{hint}</p>
    </section>
  )
}
