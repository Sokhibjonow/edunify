import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ApiError } from '@/services/api'
import { useAssignBranchAdministratorMutation } from '@/hooks/useAssignBranchAdministratorMutation'
import { useAssignBranchTeacherMutation } from '@/hooks/useAssignBranchTeacherMutation'

type Role = 'administrator' | 'teacher'
type Props = { role: Role; orgId: string; branchId: string; onClose: () => void }

const COPY: Record<Role, { title: string; idLabel: string }> = {
  administrator: { title: 'management.addAdministrator', idLabel: 'management.administratorId' },
  teacher: { title: 'management.addTeacher', idLabel: 'management.teacherId' },
}

/** Link an existing administrator/teacher to the branch by their uniqueId. */
export default function AddBranchStaffModal({ role, orgId, branchId, onClose }: Props) {
  const { t } = useTranslation()
  const [staffId, setStaffId] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const adminMutation = useAssignBranchAdministratorMutation(orgId, branchId)
  const teacherMutation = useAssignBranchTeacherMutation(orgId, branchId)
  const mutation = role === 'administrator' ? adminMutation : teacherMutation
  const copy = COPY[role]

  const formError = mutation.isError
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : t('auth.genericError')
    : null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (mutation.isPending) return

    const id = staffId.trim()
    if (!id) {
      setFieldError(t('auth.required'))
      return
    }

    if (role === 'administrator') {
      adminMutation.mutate({ administratorId: id }, { onSuccess: onClose })
    } else {
      teacherMutation.mutate({ teacherId: id }, { onSuccess: onClose })
    }
  }

  return (
    <Modal title={t(copy.title)} onClose={onClose} className="add-branch-staff-modal">
      <form onSubmit={handleSubmit} className="add-branch-staff-form">
        <Input
          label={t(copy.idLabel)}
          value={staffId}
          onChange={(e) => {
            setStaffId(e.target.value)
            setFieldError(undefined)
          }}
          error={fieldError}
          autoComplete="off"
          spellCheck={false}
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
