import type { ComponentType } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types/auth'

import DirectorManagementPage from '@/pages/director/ManagementPage'
import ManagerManagementPage from '@/pages/manager/ManagerManagementPage'

/**
 * `/management` index — renders the role-specific management page, mirroring
 * `SharedHome`. Roles without a management page fall back to `/home`.
 */
const MANAGEMENT_BY_ROLE: Partial<Record<Role, ComponentType>> = {
  director: DirectorManagementPage,
  manager: ManagerManagementPage,
  // Branch staff pages read the branch from the profile, so they serve both roles
  administrator: ManagerManagementPage,
}

export default function SharedManagement() {
  const user = useAuthStore((s) => s.user)!
  const ManagementPage = MANAGEMENT_BY_ROLE[user.role]
  if (!ManagementPage) return <Navigate to="/home" replace />
  return <ManagementPage />
}
