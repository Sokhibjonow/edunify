import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ApiError } from '@/services/api'
import { createBranchInputSchema } from '@/schemas/branchSchemas'
import { useCreateBranchMutation } from '@/hooks/useCreateBranchMutation'

type Props = { orgId: string; onClose: () => void }

export default function AddBranchModal({ orgId, onClose }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const mutation = useCreateBranchMutation(orgId)

  const formError = mutation.isError
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : t('auth.genericError')
    : null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (mutation.isPending) return

    const parsed = createBranchInputSchema.safeParse({ name })
    if (!parsed.success) {
      setFieldError(t('auth.required'))
      return
    }

    mutation.mutate(parsed.data, { onSuccess: () => onClose() })
  }

  return (
    <Modal title={t('management.addBranch')} onClose={onClose} className="add-branch-modal">
      <form onSubmit={handleSubmit} className="add-branch-form">
        <Input
          label={t('management.branchName')}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setFieldError(undefined)
          }}
          error={fieldError}
          autoComplete="off"
        />

        {formError && (
          <p className="mt-2 text-sm font-normal text-[var(--color-error-text)]">{formError}</p>
        )}

        <div className="mt-3 flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="flex-1">
            {t('common.add')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
