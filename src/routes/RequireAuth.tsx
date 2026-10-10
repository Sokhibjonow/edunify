import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

/** Guards all `/home/*` routes — unauthenticated users go to `/`. */
export default function RequireAuth() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  if (!token || !user) return <Navigate to="/" replace />
  return <Outlet />
}
