import type { z } from 'zod'
import type { ThemeColors } from '@/types/theme'
import type { organizationSchema, orgLogoPatchResultSchema, orgThemePatchResultSchema } from '@/schemas/orgSchemas'

export type Organization = z.infer<typeof organizationSchema>
export type OrgLogoPatchResult = z.infer<typeof orgLogoPatchResultSchema>
export type OrgThemePatchResult = z.infer<typeof orgThemePatchResultSchema>

/** Persisted branding snapshot — React Query owns the full Organization. */
export type OrganizationBranding = {
  organizationId: string
  lightTheme: ThemeColors
  darkTheme: ThemeColors
  logoUrl: string | null
}
