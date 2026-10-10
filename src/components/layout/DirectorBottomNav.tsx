import { useSearchParams } from 'react-router-dom'
import { House, BriefcaseBusiness, Wallet, Layers, Users } from 'lucide-react'
import StaffBottomNav, { type StaffNavItem } from '@/components/layout/StaffBottomNav'

/** Director navigation: same sections as the manager; branch pages keep the chosen `?branch=`. */
export default function DirectorBottomNav() {
  const [params] = useSearchParams()
  const branch = params.get('branch')
  const keep = branch ? `?branch=${encodeURIComponent(branch)}` : ''

  const items: StaffNavItem[] = [
    { to: '/home', labelKey: 'staffNav.home', icon: House },
    { to: '/management', labelKey: 'staffNav.management', icon: BriefcaseBusiness },
    { to: `/payments${keep}`, labelKey: 'staffNav.payments', icon: Wallet },
    { to: `/classes${keep}`, labelKey: 'staffNav.classes', icon: Layers },
    { to: `/students${keep}`, labelKey: 'staffNav.students', icon: Users },
  ]

  return <StaffBottomNav items={items} />
}
