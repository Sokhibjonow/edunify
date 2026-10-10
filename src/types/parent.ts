import type { z } from 'zod'
import type {
  parentChildSchema,
  childOverviewSchema,
  studentParentSchema,
  parentLookupSchema,
} from '@/schemas/parentSchemas'

export type ParentChild = z.infer<typeof parentChildSchema>
export type ChildOverview = z.infer<typeof childOverviewSchema>
export type StudentParent = z.infer<typeof studentParentSchema>
export type ParentLookup = z.infer<typeof parentLookupSchema>
