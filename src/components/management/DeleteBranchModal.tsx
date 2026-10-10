import { useTranslation } from 'react-i18next'
import { TriangleAlert } from 'lucide-react'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import { ApiError } from '@/services/api'
import { useDeleteBranchMutation } from '@/hooks/useDeleteBranchMutation'
import type { Branch } from '@/types/branch'

type Props = { branch: Branch; orgId: string; onClose: () => void }

export default function DeleteBranchModal({ branch, orgId, onClose }: Props) {
  const { t } = useTranslation()
  const mutation = useDeleteBranchMutation(orgId)

  const error = mutation.isError
    ? mutation.error instanceof ApiError && mutation.error.status === 409
      ? t('management.deleteBranchHasClasses')
      : t('auth.genericError')
    : null

  return (
    <ConfirmDeleteModal
      className="delete-branch-modal"
      title={t('management.deleteBranch')}
      warningText={t('management.deleteBranchWarning', { name: branch.name })}
      icon={<TriangleAlert size={48} strokeWidth={1.8} />}
      onCancel={onClose}
      onConfirm={() => mutation.mutate(branch.id, { onSuccess: onClose })}
      error={error}
      pending={mutation.isPending}
    />
  )
}
