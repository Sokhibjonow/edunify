import { z } from 'zod'
import { themeColorsSchema } from '@/schemas/themeSchemas'

export const activationStatusSchema = z.enum(['pending', 'active', 'suspended'])

export const orgBrandingSchema = z.object({
  organizationId: z.string(),
  lightTheme: themeColorsSchema,
  darkTheme: themeColorsSchema,
  logoUrl: z.string().nullable(),
})

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  ownerId: z.string(),
  logoUrl: z.string().nullable(),
  activationStatus: activationStatusSchema,
  joinCode: z.string(),
  createdAt: z.string(),
  lightTheme: themeColorsSchema,
  darkTheme: themeColorsSchema,
})

export const orgLogoPatchResultSchema = z.object({
  logoUrl: z.string(),
})

export const orgThemePatchInputSchema = z.object({
  lightTheme: themeColorsSchema.optional(),
  darkTheme: themeColorsSchema.optional(),
})

export const orgThemePatchResultSchema = z.object({
  lightTheme: themeColorsSchema,
  darkTheme: themeColorsSchema,
})
