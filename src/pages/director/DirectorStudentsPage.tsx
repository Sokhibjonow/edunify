import DirectorBranchPage from '@/components/layout/DirectorBranchPage'
import BranchStudentsView from '@/components/students/BranchStudentsView'

export default function DirectorStudentsPage() {
  return <DirectorBranchPage>{(orgId, branchId) => <BranchStudentsView orgId={orgId} branchId={branchId} />}</DirectorBranchPage>
}
