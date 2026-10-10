import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary:
    'border border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]',
  secondary:
    'border border-[var(--color-line)] bg-transparent text-[var(--color-text)]',
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-sm font-normal transition duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-60 ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
