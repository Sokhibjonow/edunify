import { Navigate } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import { useAuthStore } from '@/stores/authStore'

/**
 * `/` — role selection for guests; authenticated users skip straight to the
 * shared home.
 */
export default function RootRoute() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  if (token && user) return <Navigate to="/home" replace />
  return <HomePage />
}
