import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types/auth'

type Props = { role: Role; children: ReactNode }

/**
 * Guards a role page. These pages exist only to authenticate, so an
 * already-authenticated user never belongs on one — their own role page and any
 * other role's page both send them to the shared `/home`. Unauthenticated users
 * see the page (to log in). Backend still enforces tenancy via JWT.
 */
export default function RequireRole({ children }: Props) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  if (token && user) return <Navigate to="/home" replace />
  return <>{children}</>
}
