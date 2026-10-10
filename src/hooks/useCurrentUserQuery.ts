import { useQuery, useQueryClient } from '@tanstack/react-query'
import { me } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

export function useCurrentUserQuery() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await me()
      queryClient.invalidateQueries({ queryKey: ['connection', 'status'] })
      return user
    },
    enabled: !!token,
    // A 401 means the JWT is invalid — retrying won't help; surface it at once
    // so the session gets cleared.
    retry: false,
  })
}
