import type { NavigateFunction } from 'react-router-dom'

/**
 * Holds the router's navigate function so non-React modules (the axios
 * response interceptor) can redirect without touching window.location.
 * Set once by NavigationBridge mounted inside the router.
 */
let navigate: NavigateFunction | null = null

export function setNavigate(fn: NavigateFunction) {
  navigate = fn
}

export function navigateTo(path: string) {
  if (navigate) navigate(path)
}
