import { useQuery } from '@tanstack/react-query'
import { getProfile } from '@/services/profileService'
import { useAuthStore } from '@/stores/authStore'

export function useProfileQuery() {
  const token = useAuthStore((s) => s.token)

  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: !!token,
  })
}
