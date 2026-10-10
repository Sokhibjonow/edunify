import type { z } from 'zod'
import type {
  connectionStatusSchema,
  directorActivationStatusSchema,
  connectionStatusResponseSchema,
  connectionRequestInputSchema,
} from '@/schemas/connectionSchemas'

export type ConnectionStatus = z.infer<typeof connectionStatusSchema>
export type DirectorActivationStatus = z.infer<typeof directorActivationStatusSchema>
export type ConnectionStatusResponse = z.infer<typeof connectionStatusResponseSchema>
export type ConnectionRequestInput = z.infer<typeof connectionRequestInputSchema>
