---
name: zustand-store
description: Use when creating or editing a Zustand store (auth, theme, UI prefs, modals, toasts) or reading store state in components.
---

# Zustand Stores

## Rules
- Client state only. Never server data (that's React Query).
- One small store per concern in `src/stores/<name>Store.ts`, hook named `use<Name>Store`. No mega-store.
- Persist only what must survive refresh. `persist` name = filename minus `Store` (`themeStore.ts` → `'theme'`).
- `authStore` is persisted (JWT survives refresh). Language is NOT a store (i18next + `localStorage`).
- Components read with selectors: `useAuthStore((s) => s.user)`. Never `useAuthStore()` (whole-store subscription causes re-renders).
- Selecting several values: use `useShallow`.
- Outside React (services, interceptors): `useAuthStore.getState()`.
- Actions live inside the store. No side effects other than `set` (no fetching).

## Template: authStore

```ts
// src/types/auth.ts
export type Role =
  | 'edunify_admin'
  | 'director'
  | 'manager'
  | 'administrator'
  | 'teacher'
  | 'student'
  | 'parent';

export type ActivationStatus = 'pending' | 'active' | 'rejected';

export type AuthUser = {
  id: string;
  uniqueId: string;
  email: string;
  fullName: string;
  role: Role;
  activationStatus?: ActivationStatus; // director (org status) and teacher only
};
```

```ts
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth';

type Session = {
  user: AuthUser;
  token: string;
  organizationId?: string | null;
  branchId?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  organizationId: string | null; // director, manager, administrator, teacher only
  branchId: string | null;       // manager, administrator, teacher only
  login: (session: Session) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      organizationId: null,
      branchId: null,
      login: ({ user, token, organizationId = null, branchId = null }) =>
        set({ user, token, organizationId, branchId }),
      logout: () => set({ user: null, token: null, organizationId: null, branchId: null }),
    }),
    { name: 'auth' },
  ),
);
```
On `logout`, also call `queryClient.clear()` (in the logout hook or the 401 handler) so no cached data leaks to the next user.

## Template: toastStore

```ts
// src/stores/toastStore.ts
import { create } from 'zustand';

export type Toast = { id: number; type: 'success' | 'error' | 'info'; messageKey: string };

type ToastState = {
  toasts: Toast[];
  show: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  show: (t) => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { ...t, id }] });
    setTimeout(() => get().dismiss(id), 4000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
}));
```
Toasts store i18n keys, not translated text. `ui/Toaster` translates at render.

## Template: reading multiple values

```ts
import { useShallow } from 'zustand/react/shallow';

const { organizationId, branchId } = useAuthStore(
  useShallow((s) => ({ organizationId: s.organizationId, branchId: s.branchId })),
);
```
