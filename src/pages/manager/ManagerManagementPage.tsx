import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ManagerHeader from '@/components/layout/ManagerHeader'
import ManagerBottomNav from '@/components/layout/ManagerBottomNav'
import BranchStaffSection from '@/components/management/BranchStaffSection'
import AddBranchStaffModal from '@/components/management/AddBranchStaffModal'
import { useBranchAdministratorsQuery } from '@/hooks/useBranchAdministratorsQuery'
import { useBranchTeachersQuery } from '@/hooks/useBranchTeachersQuery'
import { useAuthStore } from '@/stores/authStore'

type AddRole = 'administrator' | 'teacher'

export default function ManagerManagementPage() {
  const { t } = useTranslation()
  const orgId = useAuthStore((s) => s.organizationId)
  const branchId = useAuthStore((s) => s.branchId)
  const [addRole, setAddRole] = useState<AddRole | null>(null)

  const administrators = useBranchAdministratorsQuery(orgId, branchId)
  const teachers = useBranchTeachersQuery(orgId, branchId)

  return (
    <>
      <ManagerHeader />
      <main className="management-page mx-auto flex max-w-md flex-col gap-3 p-3 pb-24">
        {orgId && branchId ? (
          <>
            <BranchStaffSection
              className="administrators-section"
              role="administrator"
              title={t('management.administrators')}
              addLabel={t('management.addAdministrator')}
              onAdd={() => setAddRole('administrator')}
              items={administrators.data}
              isLoading={administrators.isLoading}
              isError={administrators.isError}
              onRetry={() => administrators.refetch()}
              orgId={orgId}
              branchId={branchId}
            />

            <BranchStaffSection
              className="teachers-section"
              role="teacher"
              title={t('management.teachers')}
              addLabel={t('management.addTeacher')}
              onAdd={() => setAddRole('teacher')}
              items={teachers.data}
              isLoading={teachers.isLoading}
              isError={teachers.isError}
              onRetry={() => teachers.refetch()}
              orgId={orgId}
              branchId={branchId}
            />
          </>
        ) : (
          <p className="text-sm font-normal text-[var(--color-text-soft)]">{t('common.empty')}</p>
        )}
      </main>

      {addRole && orgId && branchId && (
        <AddBranchStaffModal
          role={addRole}
          orgId={orgId}
          branchId={branchId}
          onClose={() => setAddRole(null)}
        />
      )}

      <ManagerBottomNav />
    </>
  )
}
