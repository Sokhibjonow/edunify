import RoleHomeWithConnection from '@/components/connection/RoleHomeWithConnection'
import ManagerBottomNav from '@/components/layout/ManagerBottomNav'
import ManagerHome from '@/components/home/ManagerHome'

/** An administrator runs the same branch as its manager: same dashboard and sections. */
export default function AdministratorHomePage() {
  return (
    <>
      <RoleHomeWithConnection
        i18nKey="administrator"
        pageClassName="administrator-home-page"
        connectedContent={<ManagerHome />}
      />
      <ManagerBottomNav />
    </>
  )
}
