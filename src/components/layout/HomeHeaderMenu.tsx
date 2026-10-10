import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { House, LayoutDashboard, LogOut, Menu, Palette, User } from 'lucide-react'
import ThemeToggle from '@/components/layout/ThemeToggle'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher'
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/hooks/useLogout'

type Props = {
  /** Overrides the trigger button styling. Defaults to the standard bordered icon button. */
  triggerClassName?: string
}

const DEFAULT_TRIGGER_CLASS =
  'inline-flex cursor-pointer items-center justify-center rounded-lg border border-[var(--color-line)] bg-transparent p-1.5'

export default function HomeHeaderMenu({ triggerClassName = DEFAULT_TRIGGER_CLASS }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logout = useLogout()
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const isDirector = user?.role === 'director'

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

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  const itemClass =
    'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)] transition duration-150 ease-in-out hover:bg-[var(--color-surface-hover)]'

  return (
    <div ref={rootRef} className="header-navigation relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('header.menu')}
        aria-haspopup="menu"
        aria-expanded={open}
        className={triggerClassName}
      >
        <Menu size={18} strokeWidth={1.8} className="text-[var(--color-text-strong)]" />
      </button>

      {open && (
        <div
          role="menu"
          className="header-menu absolute right-0 z-50 mt-1.5 min-w-[180px] rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] p-1"
        >
          <button type="button" role="menuitem" onClick={() => go('/home')} className={itemClass}>
            <House size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-strong)]" />
            <span>{t('home.pageTitle')}</span>
          </button>

          <button type="button" role="menuitem" onClick={() => go('/profile')} className={itemClass}>
            <User size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-strong)]" />
            <span>{t('profile.title')}</span>
          </button>

          {isDirector && (
            <button type="button" role="menuitem" onClick={() => go('/appearance')} className={itemClass}>
              <Palette size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-strong)]" />
              <span>{t('profile.appearance')}</span>
            </button>
          )}

          {isDirector && (
            <button type="button" role="menuitem" onClick={() => go('/management')} className={itemClass}>
              <LayoutDashboard size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-strong)]" />
              <span>{t('header.management')}</span>
            </button>
          )}

          <ThemeToggle label={t('header.theme')} role="menuitem" />
          <LanguageSwitcher label={t('header.language')} role="menuitem" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className={itemClass}
          >
            <LogOut size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-strong)]" />
            <span>{t('profile.logout')}</span>
          </button>
        </div>
      )}
    </div>
  )
}
