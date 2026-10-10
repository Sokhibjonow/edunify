import { useAuthStore } from '@/stores/authStore'
import { useActiveOrganizationQuery } from '@/hooks/useActiveOrganizationQuery'
import { useOrganizationQuery } from '@/hooks/useOrganizationQuery'

/** Active organization name and logo — React Query first, branding snapshot for startup. */
export function useActiveOrganizationBranding() {
  const orgId = useAuthStore((s) => s.organizationId)
  const snapshotLogo = useAuthStore((s) => s.organizationBranding?.logoUrl)
  const { data: orgById } = useOrganizationQuery(orgId)
  const { data: activeOrg } = useActiveOrganizationQuery()

  const org = orgById ?? activeOrg
  return {
    name: org?.name ?? null,
    logoUrl: org?.logoUrl ?? snapshotLogo ?? null,
  }
}
