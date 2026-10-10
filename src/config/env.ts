import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().min(1),
  VITE_USE_MOCKS: z.string().optional(),
})

const parsed = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_USE_MOCKS: import.meta.env.VITE_USE_MOCKS,
})

export const env = {
  apiUrl: parsed.VITE_API_URL,
  useMocks: parsed.VITE_USE_MOCKS === 'true',
}
