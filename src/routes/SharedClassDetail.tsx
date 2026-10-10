import type { ComponentType } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types/auth'

import TeacherClassDetailPage from '@/pages/teacher/TeacherClassDetailPage'
import StudentClassDetailPage from '@/pages/student/StudentClassDetailPage'

/** `/classes/:classId`: the role-specific class page, mirroring `SharedClasses`. */
const CLASS_DETAIL_BY_ROLE: Partial<Record<Role, ComponentType>> = {
  teacher: TeacherClassDetailPage,
  student: StudentClassDetailPage,
}

export default function SharedClassDetail() {
  const user = useAuthStore((s) => s.user)!
  const Page = CLASS_DETAIL_BY_ROLE[user.role]
  if (!Page) return <Navigate to="/home" replace />
  return <Page />
}
