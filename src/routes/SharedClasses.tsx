import type { ComponentType } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types/auth'

import ManagerClassesPage from '@/pages/manager/ManagerClassesPage'
import TeacherClassesPage from '@/pages/teacher/TeacherClassesPage'
import DirectorClassesPage from '@/pages/director/DirectorClassesPage'

/**
 * `/classes` index — renders the role-specific classes page, mirroring
 * `SharedHome`. Roles without a classes page fall back to `/home`.
 */
const CLASSES_BY_ROLE: Partial<Record<Role, ComponentType>> = {
  director: DirectorClassesPage,
  manager: ManagerClassesPage,
  administrator: ManagerClassesPage,
  teacher: TeacherClassesPage,
}

export default function SharedClasses() {
  const user = useAuthStore((s) => s.user)!
  const ClassesPage = CLASSES_BY_ROLE[user.role]
  if (!ClassesPage) return <Navigate to="/home" replace />
  return <ClassesPage />
}
