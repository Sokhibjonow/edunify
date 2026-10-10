---
name: mock-data
description: Use when adding or changing handlers or seed data in src/services/mocks/fakeBackend.ts, or when testing a role in mock mode.
---

# Mock Backend & Seed Data

## Rules
- Everything mock lives in `src/services/mocks/` (`fakeBackend.ts` + `seed.ts`). `.ts` only.
- Handlers return `Envelope<unknown>`, the same shape as the real API after normalization.
- Every protected handler: `verifyToken` → role check → ownership check → result. Return `401` / `403` / `404` envelopes like the real backend would.
- Simulate latency (`delay(200–400ms)`); AI generation `delay(1500)`.
- Paginate lists with the shared `paginate` helper.
- Mutations change the in-memory `db` so the UI reflects them after invalidation. State resets on page reload.
- Data must satisfy the zod schemas. A mock that fails validation is a bug in the mock.
- Seed data is realistic: Uzbek and Russian names, `+998` phones, UZS amounts, `XXX-XXX-XXX` uniqueIds.

## Seed: one account per role and state
| Email | Password | Role | Purpose |
|---|---|---|---|
| `admin@edunify.uz` | `password` | edunify_admin | Approvals |
| `director@demo.uz` | `password` | director | Active org |
| `director.pending@demo.uz` | `password` | director | Pending org → `/pending` |
| `manager@demo.uz` | `password` | manager | Branch A |
| `admin.branch@demo.uz` | `password` | administrator | Branch A |
| `teacher@demo.uz` | `password` | teacher | Active, assigned to 2 classes, 3 modules |
| `teacher.pending@demo.uz` | `password` | teacher | Pending → `/pending` |
| `student@demo.uz` | `password` | student | In 2 classes |
| `parent@demo.uz` | `password` | parent | Linked to the student above |

Include: 1 active org with 2 branches, 1 pending org, 4–6 classes, one class without a teacher, one module not connected to any class, attendance, ratings and payments for the seed student.

## Template

```ts
// src/services/mocks/seed.ts
import type { AuthUser } from '@/types/auth';
import type { ClassItem } from '@/types/class';

type SeedUser = AuthUser & { password: string; organizationId: string | null; branchId: string | null };

export const db = {
  users: [
    {
      id: 'u-dir-1', uniqueId: 'D7K-2PQ-9XA', email: 'director@demo.uz', password: 'password',
      fullName: 'Dilshod Karimov', role: 'director', activationStatus: 'active',
      organizationId: 'org-1', branchId: null,
    },
    // …one per row in the table above
  ] as SeedUser[],
  classes: [
    { id: 'cls-1', name: 'IELTS 6.5 — Morning', branchId: 'br-1', teacherId: 'u-tch-1', studentCount: 12 },
    { id: 'cls-2', name: 'Math Olympiad', branchId: 'br-1', teacherId: null, studentCount: 8 },
  ] as ClassItem[],
};
```

```ts
// src/services/mocks/fakeBackend.ts
import { db } from '@/services/mocks/seed';
import type { Envelope, Page } from '@/types/api';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const ok = <T>(data: T): Envelope<T> => ({ ok: true, data });
const fail = (status: number, error: string): Envelope<never> => ({ ok: false, error, status });

// Fake JWT: "mock.<userId>". Opaque to the UI, same as a real token.
const issueToken = (userId: string) => `mock.${userId}`;
const verifyToken = (token: string | null) =>
  token?.startsWith('mock.') ? db.users.find((u) => u.id === token.slice(5)) ?? null : null;

const paginate = <T>(items: T[], page: number, pageSize: number): Page<T> => ({
  items: items.slice((page - 1) * pageSize, page * pageSize),
  page,
  pageSize,
  total: items.length,
});

export const mockApi = {
  async login(email: string, password: string) {
    await delay();
    const user = db.users.find((u) => u.email === email && u.password === password);
    if (!user) return fail(401, 'Invalid credentials');
    const { id, uniqueId, fullName, role, activationStatus } = user;
    return ok({
      user: { id, uniqueId, email: user.email, fullName, role, activationStatus },
      token: issueToken(id),
      organizationId: user.organizationId,
      branchId: user.branchId,
    });
  },

  async getClasses(token: string | null, orgId: string, branchId: string, p: { page: number; pageSize: number }) {
    await delay();
    const user = verifyToken(token);
    if (!user) return fail(401, 'Unauthorized');
    if (user.organizationId !== orgId) return fail(403, 'Forbidden');
    if (['manager', 'administrator', 'teacher'].includes(user.role) && user.branchId !== branchId) {
      return fail(403, 'Forbidden');
    }
    return ok(paginate(db.classes.filter((c) => c.branchId === branchId), p.page, p.pageSize));
  },
};
```
`401` from the mock reaches the app as a thrown `ApiError(…, 401)`; the global `QueryCache`/`MutationCache` handler in `query-hooks` logs out, so mock and real behave the same.
