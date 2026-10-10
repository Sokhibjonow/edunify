import type { ComponentType } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types/auth'

import ManagerPaymentsPage from '@/pages/manager/ManagerPaymentsPage'
import DirectorPaymentsPage from '@/pages/director/DirectorPaymentsPage'

/**
 * `/payments` index — renders the role-specific payments page, mirroring
 * `SharedHome`. Roles without a payments page fall back to `/home`.
 */
const PAYMENTS_BY_ROLE: Partial<Record<Role, ComponentType>> = {
  director: DirectorPaymentsPage,
  manager: ManagerPaymentsPage,
  administrator: ManagerPaymentsPage,
}

export default function SharedPayments() {
  const user = useAuthStore((s) => s.user)!
  const PaymentsPage = PAYMENTS_BY_ROLE[user.role]
  if (!PaymentsPage) return <Navigate to="/home" replace />
  return <PaymentsPage />
}
