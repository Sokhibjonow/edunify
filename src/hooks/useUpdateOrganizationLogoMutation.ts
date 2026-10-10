import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchOrgLogo } from '@/services/orgService'
import { useAuthStore } from '@/stores/authStore'
import type { Organization } from '@/types/org'

export function useUpdateOrganizationLogoMutation(orgId: string) {
  const queryClient = useQueryClient()
  const updateOrganizationBranding = useAuthStore((s) => s.updateOrganizationBranding)

  return useMutation({
    mutationFn: (file: File) => patchOrgLogo(orgId, file),
    onSuccess: (data) => {
      queryClient.setQueryData<Organization>(['org', orgId], (current) =>
        current ? { ...current, logoUrl: data.logoUrl } : current,
      )
      queryClient.setQueriesData<Organization>({ queryKey: ['activeOrganization'] }, (current) =>
        current?.id === orgId ? { ...current, logoUrl: data.logoUrl } : current,
      )
      queryClient.invalidateQueries({ queryKey: ['org', orgId] })

      const branding = useAuthStore.getState().organizationBranding
      if (branding?.organizationId === orgId) {
        updateOrganizationBranding({ ...branding, logoUrl: data.logoUrl })
      }
    },
  })
}
