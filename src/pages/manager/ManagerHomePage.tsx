import RoleHomeWithConnection from '@/components/connection/RoleHomeWithConnection'
import ManagerBottomNav from '@/components/layout/ManagerBottomNav'
import ManagerHome from '@/components/home/ManagerHome'

export default function ManagerHomePage() {
  return (
    <>
      <RoleHomeWithConnection
        i18nKey="manager"
        pageClassName="manager-home-page"
        connectedContent={<ManagerHome />}
      />
      <ManagerBottomNav />
    </>
  )
}
