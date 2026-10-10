import type { ComponentType } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types/auth'

import ManagerStudentsPage from '@/pages/manager/ManagerStudentsPage'
import DirectorStudentsPage from '@/pages/director/DirectorStudentsPage'

/**
 * `/students` index — renders the role-specific students page, mirroring
 * `SharedHome`. Roles without a students page fall back to `/home`.
 */
const STUDENTS_BY_ROLE: Partial<Record<Role, ComponentType>> = {
  director: DirectorStudentsPage,
  manager: ManagerStudentsPage,
  administrator: ManagerStudentsPage,
}

export default function SharedStudents() {
  const user = useAuthStore((s) => s.user)!
  const StudentsPage = STUDENTS_BY_ROLE[user.role]
  if (!StudentsPage) return <Navigate to="/home" replace />
  return <StudentsPage />
}
