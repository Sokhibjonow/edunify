import { useQuery } from '@tanstack/react-query'
import { resolveActiveOrganization } from '@/services/orgService'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery'

/** Resolves the active org after /auth/me succeeds — React Query owns the full Organization. */
export function useActiveOrganizationQuery() {
  const token = useAuthStore((s) => s.token)
  const { data: user, isSuccess } = useCurrentUserQuery()

  return useQuery({
    queryKey: ['activeOrganization', user?.uniqueId],
    queryFn: () => resolveActiveOrganization(user!),
    enabled: !!token && isSuccess && !!user,
  })
}
