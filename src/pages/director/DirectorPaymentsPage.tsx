import DirectorBranchPage from '@/components/layout/DirectorBranchPage'
import BranchPaymentsView from '@/components/payments/BranchPaymentsView'

export default function DirectorPaymentsPage() {
  return <DirectorBranchPage>{(orgId, branchId) => <BranchPaymentsView orgId={orgId} branchId={branchId} />}</DirectorBranchPage>
}
