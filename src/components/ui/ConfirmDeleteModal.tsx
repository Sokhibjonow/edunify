import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

type Props = {
  title: string
  warningText: string
  icon: ReactNode
  onCancel: () => void
  onConfirm: () => void
  className?: string
  /** Shown under the warning when the delete request failed. */
  error?: string | null
  pending?: boolean
}

const DELETE_COUNTDOWN_SECONDS = 3

export default function ConfirmDeleteModal({
  title,
  warningText,
  icon,
  onCancel,
  onConfirm,
  className,
  error,
  pending = false,
}: Props) {
  const { t } = useTranslation()
  const [secondsLeft, setSecondsLeft] = useState(DELETE_COUNTDOWN_SECONDS)

  useEffect(() => {
    setSecondsLeft(DELETE_COUNTDOWN_SECONDS)
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <Modal title={title} onClose={onCancel} className={className}>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="text-[var(--color-error-text)]">{icon}</div>
        <p className="text-sm font-normal text-[var(--color-text)]">{warningText}</p>
        {error && (
          <p role="alert" className="w-full rounded-lg bg-[var(--color-error-soft)] px-2.5 py-1.5 text-sm font-normal text-[var(--color-error-text)]">
            {error}
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          {t('common.cancel')}
        </Button>
        <button
          type="button"
          disabled={secondsLeft > 0 || pending}
          onClick={onConfirm}
          className="flex-1 cursor-pointer rounded-lg border border-[var(--color-error)] bg-[var(--color-error)] px-2.5 py-1.5 text-sm font-normal text-[var(--color-on-primary)] transition duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-60"
        >
          {secondsLeft > 0 ? t('common.deleteCountdown', { count: secondsLeft }) : t('common.delete')}
        </button>
      </div>
    </Modal>
  )
}
