import { useQuery } from '@tanstack/react-query'
import { getConnectionStatus } from '@/services/connectionService'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types/auth'

const CONNECTABLE_ROLES: Role[] = ['manager', 'administrator', 'teacher', 'student', 'parent']

export function useConnectionStatusQuery() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)

  return useQuery({
    queryKey: ['connection', 'status'],
    queryFn: getConnectionStatus,
    enabled: !!token && !!role && CONNECTABLE_ROLES.includes(role),
  })
}
