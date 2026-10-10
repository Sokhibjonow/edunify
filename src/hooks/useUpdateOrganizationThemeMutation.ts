import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchOrgTheme } from '@/services/orgService'
import { useAuthStore } from '@/stores/authStore'
import type { z } from 'zod'
import type { orgThemePatchInputSchema } from '@/schemas/orgSchemas'

type PatchInput = z.infer<typeof orgThemePatchInputSchema>

export function useUpdateOrganizationThemeMutation(orgId: string) {
  const queryClient = useQueryClient()
  const updateOrganizationBranding = useAuthStore((s) => s.updateOrganizationBranding)

  return useMutation({
    mutationFn: (input: PatchInput) => patchOrgTheme(orgId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['org', orgId] })
      const branding = useAuthStore.getState().organizationBranding
      if (branding?.organizationId === orgId) {
        updateOrganizationBranding({
          organizationId: orgId,
          lightTheme: data.lightTheme,
          darkTheme: data.darkTheme,
          logoUrl: branding.logoUrl,
        })
      }
    },
  })
}
