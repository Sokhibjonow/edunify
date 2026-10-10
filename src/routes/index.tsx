import { Routes, Route, Navigate } from 'react-router-dom'
import RootRoute from '@/routes/RootRoute'
import SharedHome from '@/routes/SharedHome'
import RequireAuth from '@/routes/RequireAuth'
import RequireRole from '@/routes/RequireRole'
import AuthBootstrap from '@/routes/AuthBootstrap'
import SharedManagement from '@/routes/SharedManagement'
import SharedPayments from '@/routes/SharedPayments'
import SharedClasses from '@/routes/SharedClasses'
import SharedClassDetail from '@/routes/SharedClassDetail'
import SharedStudents from '@/routes/SharedStudents'
import ProfilePage from '@/pages/profile/ProfilePage'
import ChangePasswordPage from '@/pages/profile/ChangePasswordPage'
import AppearancePage from '@/pages/profile/AppearancePage'

import EdunifyAdminPage from '@/pages/edunify-admin/EdunifyAdminPage'
import DirectorPage from '@/pages/director/DirectorPage'
import ManagerPage from '@/pages/manager/ManagerPage'
import AdministratorPage from '@/pages/administrator/AdministratorPage'
import TeacherPage from '@/pages/teacher/TeacherPage'
import StudentPage from '@/pages/student/StudentPage'
import ParentPage from '@/pages/parent/ParentPage'
import ParentChildPage from '@/pages/parent/ParentChildPage'

export default function AppRoutes() {
  return (
    <>
      <AuthBootstrap />
      <Routes>
        <Route path="/" element={<RootRoute />} />

        <Route element={<RequireAuth />}>
          <Route path="/home" element={<SharedHome />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/change-password" element={<ChangePasswordPage />} />
          <Route path="/appearance" element={<AppearancePage />} />
          <Route path="/home/appearance" element={<AppearancePage />} />
          <Route path="/management" element={<SharedManagement />} />
          <Route path="/payments" element={<SharedPayments />} />
          <Route path="/classes" element={<SharedClasses />} />
          <Route path="/classes/:classId" element={<SharedClassDetail />} />
          <Route path="/children/:studentId" element={<ParentChildPage />} />
          <Route path="/students" element={<SharedStudents />} />
        </Route>

        {/* Role pages — authorization / login only. */}
        <Route
          path="/edunify-admin"
          element={
            <RequireRole role="edunify_admin">
              <EdunifyAdminPage />
            </RequireRole>
          }
        />
        <Route
          path="/director"
          element={
            <RequireRole role="director">
              <DirectorPage />
            </RequireRole>
          }
        />
        <Route
          path="/manager"
          element={
            <RequireRole role="manager">
              <ManagerPage />
            </RequireRole>
          }
        />
        <Route
          path="/administrator"
          element={
            <RequireRole role="administrator">
              <AdministratorPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher"
          element={
            <RequireRole role="teacher">
              <TeacherPage />
            </RequireRole>
          }
        />
        <Route
          path="/student"
          element={
            <RequireRole role="student">
              <StudentPage />
            </RequireRole>
          }
        />
        <Route
          path="/parent"
          element={
            <RequireRole role="parent">
              <ParentPage />
            </RequireRole>
          }
        />

        <Route path="/home/profile" element={<Navigate to="/profile" replace />} />
        <Route path="/home/profile/appearance" element={<Navigate to="/appearance" replace />} />
        <Route path="/home/theming" element={<Navigate to="/appearance" replace />} />
      </Routes>
    </>
  )
}
