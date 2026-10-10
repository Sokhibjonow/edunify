import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthSession, AuthUser } from '@/types/auth'
import type { Organization, OrganizationBranding } from '@/types/org'
import { applyTheme, getCurrentThemeMode } from '@/theme'
import { syncAppliedTheme } from '@/utils/syncTheme'

type AuthState = {
  token: string | null
  user: AuthUser | null
  organizationId: string | null
  branchId: string | null
  organizationBranding: OrganizationBranding | null
  setSession: (session: AuthSession) => void
  setUser: (user: AuthUser) => void
  setOrganizationBranding: (organization: Organization) => void
  updateOrganizationBranding: (branding: OrganizationBranding) => void
  clearSession: () => void
}

const contextOf = (user: AuthUser) => ({
  organizationId:
    user.connectionStatus === 'unconnected' ? null : (user.organizationId ?? null),
  branchId: user.connectionStatus === 'unconnected' ? null : (user.branchId ?? null),
})

const brandingFrom = (organization: Organization): OrganizationBranding => ({
  organizationId: organization.id,
  lightTheme: organization.lightTheme,
  darkTheme: organization.darkTheme,
  logoUrl: organization.logoUrl,
})

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      organizationId: null,
      branchId: null,
      organizationBranding: null,
      setSession: ({ token, user }) => {
        set({ token, user, ...contextOf(user), organizationBranding: null })
        syncAppliedTheme()
      },
      setUser: (user) => set({ user, ...contextOf(user) }),
      setOrganizationBranding: (organization) => {
        set({ organizationBranding: brandingFrom(organization) })
        applyTheme(getCurrentThemeMode(), organization)
      },
      updateOrganizationBranding: (branding) => {
        set({ organizationBranding: branding })
        applyTheme(getCurrentThemeMode(), branding)
      },
      clearSession: () => {
        set({
          token: null,
          user: null,
          organizationId: null,
          branchId: null,
          organizationBranding: null,
        })
        syncAppliedTheme()
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        organizationId: state.organizationId,
        branchId: state.branchId,
        organizationBranding: state.organizationBranding,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) syncAppliedTheme()
      },
    },
  ),
)
