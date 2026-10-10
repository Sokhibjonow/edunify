import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { signup } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import type { DirectorSignupInput, SignupInput, SignupRole } from '@/types/auth'

export function useSignupMutation(role: SignupRole) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (input: SignupInput | DirectorSignupInput) => signup(input, role),
    onSuccess: (session) => {
      setSession(session)
      queryClient.setQueryData(['auth', 'me'], session.user)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['activeOrganization'] })
      navigate('/home')
    },
  })
}
