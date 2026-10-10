import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { patchProfile } from '@/services/profileService'
import { ApiError } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import type { ProfilePatchInput } from '@/types/profile'

export function useUpdateProfileMutation() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  const pushToast = useToastStore((s) => s.push)

  return useMutation({
    mutationFn: (input: ProfilePatchInput) => patchProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile'], profile)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      const user = useAuthStore.getState().user
      if (user) {
        setUser({
          ...user,
          name: profile.name,
          surname: profile.surname,
          email: profile.email,
          phone: profile.phone,
        })
      }
      pushToast(t('profile.updateSuccess'), 'success')
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        pushToast(t('profile.emailTaken'), 'error')
        return
      }
      pushToast(t('profile.updateError'), 'error')
    },
  })
}
