import { Navigate } from 'react-router-dom'
import AppHeader from '@/components/layout/AppHeader'
import ProfileView from '@/components/profile/ProfileView'
import { useAuthStore } from '@/stores/authStore'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/" replace />

  return (
    <>
      <AppHeader />
      <ProfileView />
    </>
  )
}
