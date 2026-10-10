import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import DeleteBranchStaffModal from '@/components/management/DeleteBranchStaffModal'
import { useAuthStore } from '@/stores/authStore'

type Role = 'administrator' | 'teacher'
type Member = { uniqueId: string; name: string; surname: string }
type Props = { role: Role; member: Member; orgId: string; branchId: string }

export default function BranchStaffRow({ role, member, orgId, branchId }: Props) {
  const { t } = useTranslation()
  const [deleteOpen, setDeleteOpen] = useState(false)
  // An administrator sees themselves in this list and must not unlink themselves by accident
  const isSelf = useAuthStore((s) => s.user?.uniqueId) === member.uniqueId
  const deleteLabel =
    role === 'administrator' ? t('management.deleteAdministrator') : t('management.deleteTeacher')

  return (
    <>
      <div className="branch-staff-row flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-2.5 py-1.5">
        <span className="min-w-0 flex-1 truncate text-sm font-normal text-[var(--color-text)]">
          {member.name} {member.surname}
        </span>
        <span className="shrink-0 text-xs font-normal text-[var(--color-text-soft)]">
          {member.uniqueId}
        </span>
        {isSelf ? (
          <span className="shrink-0 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
            {t('management.you')}
          </span>
        ) : (
          <button
            type="button"
            aria-label={deleteLabel}
            onClick={() => setDeleteOpen(true)}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-line)] bg-transparent p-1"
          >
            <Trash2 size={16} strokeWidth={1.8} className="text-[var(--color-text-soft)]" />
          </button>
        )}
      </div>

      {deleteOpen && (
        <DeleteBranchStaffModal
          role={role}
          member={member}
          orgId={orgId}
          branchId={branchId}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </>
  )
}
