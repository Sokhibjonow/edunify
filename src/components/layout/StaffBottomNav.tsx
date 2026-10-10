import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/** One configuration entry for the reusable staff bottom navigation. */
export type StaffNavItem = {
  /** Target route path, e.g. `/home`. Drives navigation and active state. */
  to: string
  /** i18n key resolved with `t()` for the button label. */
  labelKey: string
  /** Lucide icon rendered above the label. */
  icon: LucideIcon
}

type Props = {
  /** Navigation entries to render. Order = display order. */
  items: StaffNavItem[]
}

/**
 * Reusable, configuration-driven bottom navigation for staff roles.
 *
 * Not tied to any single role: callers pass their own `items`. Renders an
 * iOS-style floating, fully rounded, border-based island fixed to the bottom.
 */
export default function StaffBottomNav({ items }: Props) {
  const { t } = useTranslation()

  return (
    <nav
      className="staff-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
      aria-label={t('staffNav.label')}
    >
      <ul className="staff-bottom-nav-bar pointer-events-auto flex items-center gap-2 rounded-[9999px] border border-[var(--color-line)] bg-[var(--color-surface-top)] px-1.5 py-1">
        {items.map(({ to, labelKey, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end
              className="staff-bottom-nav-item flex h-[55px] w-[55px] flex-col items-center justify-center gap-0.5 rounded-[9999px] text-[var(--color-text-strong)] transition duration-150 ease-in-out hover:bg-[var(--color-surface-hover)] focus-visible:outline focus-visible:outline-[var(--color-primary)] aria-[current=page]:bg-[var(--color-surface-hover)] aria-[current=page]:text-[var(--color-primary)]"
            >
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
                <Icon size={22} strokeWidth={1.8} className="h-[22px] w-[22px]" />
              </span>
              <span className="text-[10px] leading-none font-normal">{t(labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
