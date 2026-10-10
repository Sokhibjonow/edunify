---
name: routing
description: Use when adding pages or routes, changing RequireRole or activation gating, post-login redirects, lazy loading, or 404 handling.
---

# Routing

## Rules
- Templates use React Router v7 (`react-router`). On v6, import from `react-router-dom`; check `package.json` first.
- All routes defined in `src/routes/router.tsx` with `createBrowserRouter`.
- Every role page is lazy-loaded (`lazy: () => import(...)`).
- Guards, outermost first: `RequireAuth` → `RequireRole` → `RequireActive` → `AppShell`.
- Gating is UI-only; the backend enforces access.
- Unauthorized role → redirect to the user's own home. Unauthenticated → `/login`.
- Gated (inactive) director or teacher → `/pending` only.
- Unknown path → `NotFoundPage`.
- Route paths are lowercase kebab-case. Role prefix = role name with `_` → `-` (`edunify_admin` → `/edunify-admin`).
- Never `window.location`; use `useNavigate` or `navigateTo` (see `api-client`).

## Template: role homes

```ts
// src/routes/roleHome.ts
import type { Role } from '@/types/auth';

export const roleHome: Record<Role, string> = {
  edunify_admin: '/edunify-admin',
  director: '/director',
  manager: '/manager',
  administrator: '/administrator',
  teacher: '/teacher',
  student: '/student',
  parent: '/parent',
};
```

## Template: guards

```tsx
// src/routes/guards.tsx
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { roleHome } from '@/routes/roleHome';
import type { Role } from '@/types/auth';

export function RequireAuth() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={roleHome[user.role]} replace />;
  return <Outlet />;
}

export function RequireActive() {
  const user = useAuthStore((s) => s.user);
  if (user && (user.role === 'director' || user.role === 'teacher') && user.activationStatus !== 'active') {
    return <Navigate to="/pending" replace />;
  }
  return <Outlet />;
}
```
`user.activationStatus` is the org status for a director and the personal status for a teacher. The login response must provide it.

## Template: router

```tsx
// src/routes/router.tsx
import { createBrowserRouter } from 'react-router';
import { RequireAuth, RequireRole, RequireActive } from '@/routes/guards';
import { AppShell } from '@/components/layout/AppShell';
import { RootLayout } from '@/components/layout/RootLayout';

export const router = createBrowserRouter([
  {
    element: <RootLayout />, // registers setNavigate, renders ErrorBoundary + Toaster
    children: [
      { path: '/login', lazy: () => import('@/pages/auth/LoginPage') },
      { path: '/signup', lazy: () => import('@/pages/auth/SignupPage') },
      {
        element: <RequireAuth />,
        children: [
          { path: '/pending', lazy: () => import('@/pages/auth/PendingActivationPage') },
          { path: '/', lazy: () => import('@/pages/auth/HomeRedirect') }, // → roleHome[user.role]
          {
            element: <RequireRole roles={['director']} />,
            children: [
              {
                element: <RequireActive />,
                children: [
                  {
                    path: '/director',
                    element: <AppShell />,
                    children: [
                      { index: true, lazy: () => import('@/pages/director/DashboardPage') },
                      { path: 'classes', lazy: () => import('@/pages/director/ClassesPage') },
                    ],
                  },
                ],
              },
            ],
          },
          // Repeat per role. Only director and teacher get RequireActive.
        ],
      },
      { path: '*', lazy: () => import('@/pages/NotFoundPage') },
    ],
  },
]);
```
Each lazily loaded page file also exports `Component` at the bottom: `export { ClassesPage as Component };`

## After login
Redirect to `location.state.from` if it belongs to the user's role prefix, otherwise to `roleHome[user.role]`.
