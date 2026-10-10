import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { patchPassword } from '@/services/profileService'
import { useToastStore } from '@/stores/toastStore'
import type { ChangePasswordInput } from '@/types/profile'

export function useChangePasswordMutation() {
  const { t } = useTranslation()
  const pushToast = useToastStore((s) => s.push)

  return useMutation({
    mutationFn: (input: ChangePasswordInput) => patchPassword(input),
    onSuccess: () => {
      pushToast(t('profile.passwordSuccess'), 'success')
    },
    onError: () => {
      pushToast(t('profile.passwordError'), 'error')
    },
  })
}
