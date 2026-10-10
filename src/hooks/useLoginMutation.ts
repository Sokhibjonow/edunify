import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { login } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import type { LoginInput } from '@/types/auth'

export function useLoginMutation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (session) => {
      setSession(session)
      queryClient.setQueryData(['auth', 'me'], session.user)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['activeOrganization'] })
      navigate('/home')
    },
  })
}
