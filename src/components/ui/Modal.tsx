import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}

export default function Modal({ title, onClose, children, className = '' }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
    >
      <div
        className="absolute inset-0 bg-[var(--color-text-strong)]/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative w-full max-w-sm rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] p-3.5 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold text-[var(--color-text-strong)]">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0"
          >
            <X size={18} strokeWidth={1.8} className="text-[var(--color-text-soft)]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
