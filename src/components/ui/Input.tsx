import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export default function Input({ label, error, id, className = '', ...props }: Props) {
  const inputId = id ?? label

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-normal text-[var(--color-text)]">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)] outline-none transition duration-150 ease-in-out focus-visible:outline focus-visible:outline-[var(--color-primary)] ${
          error ? 'border-[var(--color-error)]' : 'border-[var(--color-line)]'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm font-normal text-[var(--color-error-text)]">{error}</p>
      )}
    </div>
  )
}
