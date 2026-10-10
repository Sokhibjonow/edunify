import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type Props = {
  title: string
  photos: string[]
  caption?: string
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export default function PhotoViewer({ title, photos, caption, index, onIndexChange, onClose }: Props) {
  const { t } = useTranslation()
  const count = photos.length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % count)
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + count) % count)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, count, onIndexChange, onClose])

  const navBtn = 'absolute top-1/2 -translate-y-1/2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-top)] text-[var(--color-text)]'

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-[var(--color-text-strong)]/60" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-full w-full max-w-md flex-col gap-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-[var(--color-text-strong)]">{title}</span>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm text-[var(--color-text-soft)] tabular-nums">{index + 1} / {count}</span>
            <button type="button" onClick={onClose} aria-label={t('common.close')} className="cursor-pointer border-0 bg-transparent p-0 text-[var(--color-text-soft)]">
              <X size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>
        <div className="relative min-h-0">
          <img src={photos[index]} alt="" className="max-h-[70vh] w-full rounded-md border border-[var(--color-line)] object-contain" />
          {count > 1 && (
            <>
              <button type="button" onClick={() => onIndexChange((index - 1 + count) % count)} aria-label={t('teacherClass.prevPhoto')} className={`${navBtn} left-2`}>
                <ChevronLeft size={18} strokeWidth={1.8} />
              </button>
              <button type="button" onClick={() => onIndexChange((index + 1) % count)} aria-label={t('teacherClass.nextPhoto')} className={`${navBtn} right-2`}>
                <ChevronRight size={18} strokeWidth={1.8} />
              </button>
            </>
          )}
        </div>
        {caption && (
          <p className="rounded-md border-l-2 border-[var(--color-primary)] bg-[var(--color-surface-hover)] px-2.5 py-1.5 text-sm text-[var(--color-text)]">
            {caption}
          </p>
        )}
      </div>
    </div>
  )
}
