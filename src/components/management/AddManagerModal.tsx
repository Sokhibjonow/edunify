import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ApiError } from '@/services/api'
import { assignBranchManagerInputSchema } from '@/schemas/branchSchemas'
import { useAssignBranchManagerMutation } from '@/hooks/useAssignBranchManagerMutation'

type Props = { orgId: string; branchId: string; onClose: () => void }

export default function AddManagerModal({ orgId, branchId, onClose }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [managerId, setManagerId] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; managerId?: string }>({})
  const mutation = useAssignBranchManagerMutation(orgId, branchId)

  const formError = mutation.isError
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : t('auth.genericError')
    : null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (mutation.isPending) return

    const parsed = assignBranchManagerInputSchema.safeParse({ name, managerId })
    if (!parsed.success) {
      const next: { name?: string; managerId?: string } = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'name' || key === 'managerId') next[key] = t('auth.required')
      }
      setFieldErrors(next)
      return
    }

    mutation.mutate(parsed.data, { onSuccess: () => onClose() })
  }

  return (
    <Modal title={t('management.addManager')} onClose={onClose} className="add-manager-modal">
      <form onSubmit={handleSubmit} className="add-manager-form">
        <Input
          label={t('management.managerName')}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setFieldErrors((prev) => ({ ...prev, name: undefined }))
          }}
          error={fieldErrors.name}
          autoComplete="off"
        />
        <div className="mt-2">
          <Input
            label={t('management.managerId')}
            value={managerId}
            onChange={(e) => {
              setManagerId(e.target.value)
              setFieldErrors((prev) => ({ ...prev, managerId: undefined }))
            }}
            error={fieldErrors.managerId}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

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
