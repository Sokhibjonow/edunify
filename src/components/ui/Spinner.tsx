import { LoaderCircle } from 'lucide-react'

export default function Spinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <LoaderCircle
        size={18}
        strokeWidth={1.8}
        className="animate-spin text-[var(--color-text-soft)]"
      />
    </div>
  )
}
