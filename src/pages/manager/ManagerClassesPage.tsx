import ManagerHeader from '@/components/layout/ManagerHeader'
import ManagerBottomNav from '@/components/layout/ManagerBottomNav'
import BranchClassesView from '@/components/classes/BranchClassesView'
import { useAuthStore } from '@/stores/authStore'

export default function ManagerClassesPage() {
  const orgId = useAuthStore((s) => s.organizationId)
  const branchId = useAuthStore((s) => s.branchId)

  return (
    <>
      <ManagerHeader />
      <main className="manager-classes-page mx-auto max-w-md p-3 pb-28">
        {orgId && branchId && <BranchClassesView orgId={orgId} branchId={branchId} />}
      </main>
      <ManagerBottomNav />
    </>
  )
}
