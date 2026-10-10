import type { ComponentType } from 'react'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types/auth'

import EdunifyAdminHomePage from '@/pages/edunify-admin/EdunifyAdminHomePage'
import DirectorHomePage from '@/pages/director/DirectorHomePage'
import ManagerHomePage from '@/pages/manager/ManagerHomePage'
import AdministratorHomePage from '@/pages/administrator/AdministratorHomePage'
import TeacherHomePage from '@/pages/teacher/TeacherHomePage'
import StudentHomePage from '@/pages/student/StudentHomePage'
import ParentHomePage from '@/pages/parent/ParentHomePage'

const HOME_BY_ROLE: Record<Role, ComponentType> = {
  edunify_admin: EdunifyAdminHomePage,
  director: DirectorHomePage,
  manager: ManagerHomePage,
  administrator: AdministratorHomePage,
  teacher: TeacherHomePage,
  student: StudentHomePage,
  parent: ParentHomePage,
}

/** `/home` index — renders the role-specific home dashboard. */
export default function SharedHome() {
  const user = useAuthStore((s) => s.user)!
  const RoleHomePage = HOME_BY_ROLE[user.role]
  return <RoleHomePage />
}
