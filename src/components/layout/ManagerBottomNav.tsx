import { House, BriefcaseBusiness, Wallet, Layers, Users } from 'lucide-react'
import StaffBottomNav, { type StaffNavItem } from '@/components/layout/StaffBottomNav'

/** Branch staff navigation: manager and administrator share the same sections. */
const MANAGER_NAV_ITEMS: StaffNavItem[] = [
  { to: '/home', labelKey: 'staffNav.home', icon: House },
  { to: '/management', labelKey: 'staffNav.management', icon: BriefcaseBusiness },
  { to: '/payments', labelKey: 'staffNav.payments', icon: Wallet },
  { to: '/classes', labelKey: 'staffNav.classes', icon: Layers },
  { to: '/students', labelKey: 'staffNav.students', icon: Users },
]

export default function ManagerBottomNav() {
  return <StaffBottomNav items={MANAGER_NAV_ITEMS} />
}
