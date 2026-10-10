import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'

type Props = {
  onEditName: () => void
  onDeleteBranch: () => void
}

export default function BranchActionsMenu({ onEditName, onDeleteBranch }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const itemClass =
    'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)] transition duration-150 ease-in-out hover:bg-[var(--color-surface-hover)]'

  return (
    <div ref={rootRef} className="branch-actions-menu relative inline-block shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('management.branchMenu')}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[var(--color-line)] bg-transparent p-1"
      >
        <MoreVertical size={18} strokeWidth={1.8} className="text-[var(--color-text-soft)]" />
      </button>

      {open && (
        <div
          role="menu"
          className="branch-actions-dropdown absolute right-0 z-50 mt-1.5 min-w-[160px] rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] p-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onEditName()
            }}
            className={itemClass}
          >
            <Pencil size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-strong)]" />
            <span>{t('management.editName')}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onDeleteBranch()
            }}
            className={itemClass}
          >
            <Trash2 size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-strong)]" />
            <span>{t('management.deleteBranch')}</span>
          </button>
        </div>
      )}
    </div>
  )
}
