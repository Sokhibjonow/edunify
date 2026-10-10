import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery'
import { useActiveOrganizationQuery } from '@/hooks/useActiveOrganizationQuery'

/**
 * On startup, validates the persisted JWT via GET /auth/me (through
 * useCurrentUserQuery). On success the fresh user refreshes the session; a 401
 * clears the session and returns to `/`. Resolves the active organization and
 * applies org branding via applyTheme. Renders nothing.
 */
export default function AuthBootstrap() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const setOrganizationBranding = useAuthStore((s) => s.setOrganizationBranding)
  const clearSession = useAuthStore((s) => s.clearSession)
  const { data: user, error } = useCurrentUserQuery()
  const { data: organization } = useActiveOrganizationQuery()

  useEffect(() => {
    if (user) setUser(user)
  }, [user, setUser])

  useEffect(() => {
    if (organization) setOrganizationBranding(organization)
  }, [organization, setOrganizationBranding])

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      clearSession()
      navigate('/', { replace: true })
    }
  }, [error, clearSession, navigate])

  return null
}
