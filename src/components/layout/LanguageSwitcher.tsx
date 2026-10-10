import { useState, useRef, useEffect } from 'react'
import { Languages } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import type { Language } from '@/types'

const OPTIONS: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'uz', label: "O'zbek" },
]

type Props = {
  label?: string
  className?: string
  role?: string
}

export default function LanguageSwitcher({ label, className = '', role }: Props) {
  const language = useLanguageStore((s) => s.language)
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const isRow = !!label

  // Close on outside click
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

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const handleSelect = (code: Language) => {
    setLanguage(code)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={isRow ? 'relative w-full' : 'relative inline-block'}>
      <button
        type="button"
        role={role}
        onClick={() => setOpen((v) => !v)}
        aria-label={isRow ? undefined : 'Change language'}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          isRow
            ? `flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)] transition duration-150 ease-in-out hover:bg-[var(--color-surface-hover)] ${className}`
            : 'inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0'
        }
      >
        <Languages size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-strong)]" />
        {label && <span>{label}</span>}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-[60] mt-1.5 min-w-[120px] rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] p-1"
        >
          {OPTIONS.map((opt) => {
            const isActive = opt.code === language
            return (
              <li key={opt.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(opt.code)}
                  className={`w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-sm transition duration-150 ease-in-out hover:bg-[var(--color-surface-hover)] ${
                    isActive
                      ? 'text-[var(--color-text-strong)] font-semibold'
                      : 'text-[var(--color-text)]'
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}