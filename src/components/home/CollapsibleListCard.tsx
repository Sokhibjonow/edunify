import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import Card from '@/components/ui/Card'

type Props = {
  title: string
  /** Shown (no body, not collapsible) when `count` is 0. */
  emptyTitle: string
  count: number
  defaultExpanded?: boolean
  /** Semantic identifier for the card root. */
  className?: string
  children: ReactNode
}

/**
 * Bordered card with a collapsible body and a rotating chevron. When `count` is
 * 0 it collapses to a single empty-state line with no body and no toggle.
 */
export default function CollapsibleListCard({
  title,
  emptyTitle,
  count,
  defaultExpanded = true,
  className = '',
  children,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  if (count === 0) {
    return (
      <Card className={`overflow-hidden !p-0 ${className}`}>
        <div className="flex items-center px-3.5 py-3">
          <span className="text-sm font-normal text-[var(--color-text-soft)]">{emptyTitle}</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`overflow-hidden !p-0 ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-3 text-left"
      >
        <span className="text-sm font-semibold text-[var(--color-text-strong)]">{title}</span>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[red] px-1 text-xs font-bold leading-none text-[white]">
          {count}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={1.8}
          className={`ml-auto shrink-0 text-[var(--color-text-soft)] transition-transform duration-150 ease-in-out ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {expanded && <div className="px-3.5 pb-3.5 pt-0">{children}</div>}
    </Card>
  )
}
