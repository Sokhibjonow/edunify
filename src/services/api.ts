import axios, { type AxiosError, type AxiosResponse } from 'axios'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores/authStore'
import { navigateTo } from '@/services/navigationRef'

/** Thrown by service functions when an envelope reports failure. */
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Identical shape from mock and real after normalization. */
export type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number }

export const api = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// Attach JWT from authStore when present.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize every non-2xx into a resolved { ok: false, ... } envelope so
// service functions see the same shape from both transport paths. 401 clears
// the session and redirects via the router ref (never window.location).
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0
    if (status === 401) {
      useAuthStore.getState().clearSession()
      navigateTo('/')
    }
    const data = error.response?.data as { error?: string; message?: string } | undefined
    const message = data?.error ?? data?.message ?? error.message ?? 'Request failed'
    return Promise.resolve({
      data: { ok: false, error: message, status },
    } as unknown as AxiosResponse)
  },
)
