import { useQuery } from '@tanstack/react-query'
import { getOrg } from '@/services/orgService'

export function useOrganizationQuery(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ['org', orgId],
    queryFn: () => getOrg(orgId!),
    enabled: !!orgId,
  })
}
