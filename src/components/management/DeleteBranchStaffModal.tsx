import { useTranslation } from 'react-i18next'
import { TriangleAlert } from 'lucide-react'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import { useRemoveBranchAdministratorMutation } from '@/hooks/useRemoveBranchAdministratorMutation'
import { useRemoveBranchTeacherMutation } from '@/hooks/useRemoveBranchTeacherMutation'

type Role = 'administrator' | 'teacher'
type Member = { uniqueId: string; name: string; surname: string }
type Props = { role: Role; member: Member; orgId: string; branchId: string; onClose: () => void }

const COPY: Record<Role, { title: string; warning: string; className: string }> = {
  administrator: {
    title: 'management.deleteAdministrator',
    warning: 'management.deleteAdministratorWarning',
    className: 'delete-administrator-modal',
  },
  teacher: {
    title: 'management.deleteTeacher',
    warning: 'management.deleteTeacherWarning',
    className: 'delete-teacher-modal',
  },
}

/** 3s-cooldown confirmation for removing a branch administrator/teacher. */
export default function DeleteBranchStaffModal({ role, member, orgId, branchId, onClose }: Props) {
  const { t } = useTranslation()
  const removeAdmin = useRemoveBranchAdministratorMutation(orgId, branchId)
  const removeTeacher = useRemoveBranchTeacherMutation(orgId, branchId)
  const fullName = `${member.name} ${member.surname}`.trim()
  const copy = COPY[role]

  const confirm = () => {
    if (role === 'administrator') {
      removeAdmin.mutate(member.uniqueId, { onSuccess: onClose })
    } else {
      removeTeacher.mutate(member.uniqueId, { onSuccess: onClose })
    }
  }

  return (
    <ConfirmDeleteModal
      className={copy.className}
      title={t(copy.title)}
      warningText={t(copy.warning, { name: fullName })}
      icon={<TriangleAlert size={48} strokeWidth={1.8} />}
      onCancel={onClose}
      onConfirm={confirm}
      error={removeAdmin.isError || removeTeacher.isError ? t('auth.genericError') : null}
      pending={removeAdmin.isPending || removeTeacher.isPending}
    />
  )
}
