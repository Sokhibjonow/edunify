import type { ReactNode } from 'react'

type Props = { children: ReactNode; className?: string }

export default function Card({ children, className = '' }: Props) {
  return (
    <div
      className={`rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] p-3.5 ${className}`}
    >
      {children}
    </div>
  )
}
