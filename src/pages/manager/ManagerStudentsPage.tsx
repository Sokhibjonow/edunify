import ManagerHeader from '@/components/layout/ManagerHeader'
import ManagerBottomNav from '@/components/layout/ManagerBottomNav'
import BranchStudentsView from '@/components/students/BranchStudentsView'
import { useAuthStore } from '@/stores/authStore'

export default function ManagerStudentsPage() {
  const orgId = useAuthStore((s) => s.organizationId)
  const branchId = useAuthStore((s) => s.branchId)

  return (
    <>
      <ManagerHeader />
      <main className="manager-students-page mx-auto max-w-md p-3 pb-28">
        {orgId && branchId && <BranchStudentsView orgId={orgId} branchId={branchId} />}
      </main>
      <ManagerBottomNav />
    </>
  )
}
