import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'

type Props = {
  logoUrl: string | null
  onFileSelect: (file: File) => void
  isUploading?: boolean
}

export default function LogoSection({ logoUrl, onFileSelect, isUploading }: Props) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <section className="appearance-logo-section my-4">
      <h2 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('appearance.logo')}</h2>
      <Card className="!p-2.5">
        <div className="flex items-center justify-between gap-2">
          {logoUrl ? (
            <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-1">
              <img src={logoUrl} alt="" className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-1 px-1.5">
              <span className="text-center text-xs font-normal leading-snug text-[var(--color-text-soft)]">
                {t('appearance.noLogo')}
              </span>
            </div>
          )}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="shrink-0 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {logoUrl ? t('appearance.changeLogo') : t('appearance.editLogo')}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFileSelect(file)
              e.target.value = ''
            }}
          />
        </div>
      </Card>
    </section>
  )
}
