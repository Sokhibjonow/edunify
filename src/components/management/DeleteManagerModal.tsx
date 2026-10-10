import { useTranslation } from 'react-i18next'
import { TriangleAlert } from 'lucide-react'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import { useRemoveBranchManagerMutation } from '@/hooks/useRemoveBranchManagerMutation'
import type { BranchManager } from '@/types/branch'

type Props = {
  manager: BranchManager
  orgId: string
  branchId: string
  onClose: () => void
}

export default function DeleteManagerModal({ manager, orgId, branchId, onClose }: Props) {
  const { t } = useTranslation()
  const mutation = useRemoveBranchManagerMutation(orgId, branchId)
  const managerName = `${manager.name} ${manager.surname}`.trim()

  return (
    <ConfirmDeleteModal
      className="delete-manager-modal"
      title={t('management.deleteManager')}
      warningText={t('management.deleteManagerWarning', { name: managerName })}
      icon={<TriangleAlert size={48} strokeWidth={1.8} />}
      onCancel={onClose}
      onConfirm={() => mutation.mutate(manager.uniqueId, { onSuccess: onClose })}
      error={mutation.isError ? t('auth.genericError') : null}
      pending={mutation.isPending}
    />
  )
}
