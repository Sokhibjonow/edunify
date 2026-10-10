import DirectorBranchPage from '@/components/layout/DirectorBranchPage'
import BranchClassesView from '@/components/classes/BranchClassesView'

export default function DirectorClassesPage() {
  return <DirectorBranchPage>{(orgId, branchId) => <BranchClassesView orgId={orgId} branchId={branchId} />}</DirectorBranchPage>
}
