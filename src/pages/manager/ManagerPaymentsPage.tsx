import ManagerHeader from '@/components/layout/ManagerHeader'
import ManagerBottomNav from '@/components/layout/ManagerBottomNav'
import BranchPaymentsView from '@/components/payments/BranchPaymentsView'
import { useAuthStore } from '@/stores/authStore'

export default function ManagerPaymentsPage() {
  const orgId = useAuthStore((s) => s.organizationId)
  const branchId = useAuthStore((s) => s.branchId)

  return (
    <>
      <ManagerHeader />
      <main className="manager-payments-page mx-auto max-w-md p-3 pb-28">
        {orgId && branchId && <BranchPaymentsView orgId={orgId} branchId={branchId} />}
      </main>
      <ManagerBottomNav />
    </>
  )
}
