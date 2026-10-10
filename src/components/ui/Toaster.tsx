import { useToastStore } from '@/stores/toastStore'

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div
      className="toaster pointer-events-none fixed bottom-3 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-3"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto rounded-lg border px-3 py-2 text-sm font-normal shadow-sm ${
            toast.variant === 'success'
              ? 'border-[var(--color-line)] bg-[var(--color-surface-top)] text-[var(--color-text)]'
              : 'border-[var(--color-error)] bg-[var(--color-surface-top)] text-[var(--color-error-text)]'
          }`}
        >
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="w-full cursor-pointer text-left"
          >
            {toast.message}
          </button>
        </div>
      ))}
    </div>
  )
}
