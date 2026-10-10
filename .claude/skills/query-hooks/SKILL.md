---
name: query-hooks
description: Use when writing React Query hooks, mutations, query keys, cache invalidation, or QueryClient defaults.
---

# React Query Hooks

## Rules
- Hooks call service functions only. Never axios or mocks directly.
- Read ids from `authStore` or the route; pass them to the service.
- All keys come from `src/hooks/queryKeys.ts`. Never write key arrays inline.
- Disable queries until required ids exist (`enabled: !!id`).
- Every mutation explicitly invalidates or updates the affected keys in `onSuccess`. Never rely on implicit refetch.
- No optimistic updates in the MVP unless asked.
- Consumers handle 4 states: loading / error / empty / data (see `component` skill).

## Query-key hierarchy
- Org: `['org', orgId]`
- Branch: `['org', orgId, 'branches', branchId]`; stats: append `'stats'`
- Class: `['org', orgId, 'branches', branchId, 'classes', classId]` + `'students' | 'payments' | 'attendance' | 'ratings' | 'modules'`
- Teacher Lab: `['teacher', teacherId, 'modules']`, sub-keys `'lab'` or `[..., 'class', classId]`
- Student: `['student', studentId, 'classes']`; own data `['student', studentId, 'classes', classId, 'attendance' | 'ratings' | 'payments']`
- Parent: `['parent', parentId, 'children']`; children's data via student-scoped keys
- Platform (edunify_admin): `['platform', 'orgs']`, `['platform', 'teachers']`

## Template: key factory

```ts
// src/hooks/queryKeys.ts
type ClassSub = 'students' | 'payments' | 'attendance' | 'ratings' | 'modules';
type StudentSub = 'attendance' | 'ratings' | 'payments';

export const qk = {
  org: (orgId: string) => ['org', orgId] as const,
  branch: (orgId: string, branchId: string) => [...qk.org(orgId), 'branches', branchId] as const,
  branchStats: (orgId: string, branchId: string) => [...qk.branch(orgId, branchId), 'stats'] as const,
  classes: (orgId: string, branchId: string) => [...qk.branch(orgId, branchId), 'classes'] as const,
  class: (orgId: string, branchId: string, classId: string) =>
    [...qk.classes(orgId, branchId), classId] as const,
  classSub: (orgId: string, branchId: string, classId: string, sub: ClassSub) =>
    [...qk.class(orgId, branchId, classId), sub] as const,

  teacherModules: (teacherId: string) => ['teacher', teacherId, 'modules'] as const,
  teacherLab: (teacherId: string) => [...qk.teacherModules(teacherId), 'lab'] as const,
  teacherClassModules: (teacherId: string, classId: string) =>
    [...qk.teacherModules(teacherId), 'class', classId] as const,

  studentClasses: (studentId: string) => ['student', studentId, 'classes'] as const,
  studentClassSub: (studentId: string, classId: string, sub: StudentSub) =>
    [...qk.studentClasses(studentId), classId, sub] as const,

  parentChildren: (parentId: string) => ['parent', parentId, 'children'] as const,

  platformOrgs: () => ['platform', 'orgs'] as const,
  platformTeachers: () => ['platform', 'teachers'] as const,
};
```
Prefix invalidation works because keys nest: invalidating `qk.classes(o, b)` refreshes every class under that branch.

## Template: query hook

```ts
// src/hooks/useClasses.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getClasses } from '@/services/classService';
import { useAuthStore } from '@/stores/authStore';
import { qk } from '@/hooks/queryKeys';

export function useClasses(page = 1) {
  const orgId = useAuthStore((s) => s.organizationId);
  const branchId = useAuthStore((s) => s.branchId);

  return useQuery({
    queryKey: [...qk.classes(orgId ?? '', branchId ?? ''), { page }],
    queryFn: () => getClasses(orgId!, branchId!, { page }), // ! safe: guarded by `enabled`
    enabled: !!orgId && !!branchId,
    placeholderData: keepPreviousData,
  });
}
```

## Template: mutation hook

```ts
// src/hooks/useCreateClass.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClass } from '@/services/classService';
import { useAuthStore } from '@/stores/authStore';
import { qk } from '@/hooks/queryKeys';
import type { CreateClassInput } from '@/types/class';

export function useCreateClass() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.organizationId);
  const branchId = useAuthStore((s) => s.branchId);

  return useMutation({
    mutationFn: (input: CreateClassInput) => createClass(orgId!, branchId!, input), // ! safe: page is role-gated
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.classes(orgId!, branchId!) });
      qc.invalidateQueries({ queryKey: qk.branchStats(orgId!, branchId!) });
    },
  });
}
```

## Template: QueryClient defaults

```ts
// src/main.tsx (or src/queryClient.ts)
import { QueryCache, MutationCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { navigateTo } from '@/routes/navigation';

// Mock mode never passes the axios interceptor, so 401 is also handled here.
// In real mode the interceptor already logged out; calling logout twice is harmless.
const onAuthError = (err: unknown) => {
  if (err instanceof ApiError && err.status === 401) {
    useAuthStore.getState().logout();
    queryClient.clear();
    navigateTo('/login');
  }
};

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onAuthError }),
  mutationCache: new MutationCache({ onError: onAuthError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
    },
    mutations: { retry: false },
  },
});
```

## Invalidation map (confirm against real flows before relying on it)
| Mutation | Invalidate |
|---|---|
| Create / update / delete class | `qk.classes`, `qk.branchStats` |
| Assign / unassign teacher | `qk.class`, `qk.classSub(…, 'modules')`, `qk.teacherModules(teacherId)` |
| Connect / disconnect module | `qk.teacherModules(teacherId)`, `qk.classSub(…, 'modules')` |
| Student joins class | `qk.studentClasses(studentId)`, `qk.classSub(…, 'students')` |
| Parent links student | `qk.parentChildren(parentId)` |
| Record attendance / rating / payment | `qk.classSub(…, sub)`, `qk.branchStats` |
| Approve org / teacher | `qk.platformOrgs()` / `qk.platformTeachers()` |
