import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearSession = useAuthStore((s) => s.clearSession)

  return () => {
    clearSession()
    queryClient.removeQueries({ queryKey: ['auth', 'me'] })
    navigate('/')
  }
}
