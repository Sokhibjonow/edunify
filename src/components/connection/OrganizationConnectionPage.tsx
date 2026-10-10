import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useSubmitConnectionRequestMutation } from '@/hooks/useSubmitConnectionRequestMutation'
import { connectionRequestInputSchema } from '@/schemas/connectionSchemas'
import { ApiError } from '@/services/api'

type Props = {
  requestedBranchId?: string | null
}

export default function OrganizationConnectionPage({ requestedBranchId }: Props) {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const [branchId, setBranchId] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const mutation = useSubmitConnectionRequestMutation()

  const formError = mutation.isError
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : t('auth.genericError')
    : null

  const closeModal = () => {
    setModalOpen(false)
    setBranchId('')
    setFieldError(undefined)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (mutation.isPending) return

    const parsed = connectionRequestInputSchema.safeParse({ branchId })
    if (!parsed.success) {
      setFieldError(t('connection.invalidBranchId'))
      return
    }

    mutation.mutate(parsed.data, { onSuccess: () => closeModal() })
  }

  return (
    <>
      <AppHeader />
      <main className="organization-connection-page mx-auto max-w-sm p-3">
        <Card className="organization-connection-card">
          <h1 className="organization-connection-title text-base font-normal text-[var(--color-text)]">
            {t('connection.pageTitle')}
          </h1>
          {requestedBranchId && (
            <p className="mt-3 text-sm font-normal text-[var(--color-text-soft)]">
              {t('connection.pendingRequest', { branchId: requestedBranchId })}
            </p>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="organization-connection-action mt-4 flex w-full cursor-pointer items-center justify-center rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-2.5 py-1.5 text-sm font-normal text-[var(--color-on-primary)]"
          >
            <Link size={18} strokeWidth={1.8} className="mr-1.5 text-[var(--color-on-primary)]" />
            {t('connection.connect')}
          </button>
        </Card>
      </main>

      {modalOpen && (
        <Modal
          title={t('connection.modalTitle')}
          onClose={closeModal}
          className="organization-connection-modal"
        >
          <form className="organization-connection-form" onSubmit={handleSubmit}>
            <p className="text-sm font-normal text-[var(--color-text-soft)]">
              {t('connection.modalBody')}
            </p>
            <div className="mt-3">
              <Input
                label={t('connection.branchId')}
                placeholder={t('connection.branchIdPlaceholder')}
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value)
                  setFieldError(undefined)
                }}
                error={fieldError}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <p className="mt-3 text-sm font-normal text-[var(--color-text-soft)]">
              {t('connection.reminder')}
            </p>
            {formError && (
              <p className="mt-2 text-sm font-normal text-[var(--color-error-text)]">{formError}</p>
            )}
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
                {t('connection.cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="flex-1">
                {t('connection.connect')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
