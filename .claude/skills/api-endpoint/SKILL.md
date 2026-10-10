---
name: api-endpoint
description: Use when adding or changing any API call, service function, endpoint, response type, pagination, upload, or AI lesson generation.
---

# Adding / Changing an Endpoint

## Steps (in order, all required)
1. Type in `src/types`
2. zod schema in `src/schemas` (shared by mock and real)
3. Mock handler in `src/services/mocks/fakeBackend.ts` (see `mock-data` skill)
4. Service function in `src/services/<domain>Service.ts` (template below)
5. Hook in `src/hooks` (see `query-hooks` skill)

## Rules
- Mock and real branches: same signature, same return type, same schema. The hook never knows which ran.
- Mock branch passes the token explicitly from `useAuthStore.getState()`. Real branch relies on the interceptor.
- Params may include `organizationId` / `branchId` / `classId` / `teacherId` / `studentId` → URL path segments. Hooks supply them.
- Envelope: success `{ ok: true, data: T }` → return `T`; failure `{ ok: false, error, status }` → throw `ApiError`.
- Pagination: `Page<T> = { items, page, pageSize, total }`. List functions accept `{ page?, pageSize? }`, defaults `1` / `20`.
- zod-validate non-trivial or externally controlled responses with the single shared schema.
- AI lesson generation: plain mutation that resolves on completion. NO streaming UI. Own longer timeout (`AI_TIMEOUT_MS`).
- Uploads: `FormData` through the same axios instance; omit the JSON `Content-Type`.

## Shared helpers (create once)

```ts
// src/types/api.ts
export type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };

export type PageParams = { page?: number; pageSize?: number };
```

```ts
// src/schemas/pageSchema.ts
import { z } from 'zod';

export const pageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
  });
```

```ts
// src/services/unwrap.ts
import type { z } from 'zod';
import { ApiError } from '@/services/api';
import type { Envelope } from '@/types/api';

export function unwrap<S extends z.ZodTypeAny>(res: Envelope<unknown>, schema: S): z.infer<S> {
  if (!res.ok) throw new ApiError(res.error, res.status);
  const parsed = schema.safeParse(res.data);
  if (!parsed.success) throw new ApiError('errors.invalidResponse', 0);
  return parsed.data;
}
```

## Template: domain service

```ts
// src/types/class.ts
export type ClassItem = {
  id: string;
  name: string;
  branchId: string;
  teacherId: string | null;
  studentCount: number;
};

export type CreateClassInput = { name: string };
```

```ts
// src/schemas/classSchema.ts
import { z } from 'zod';
import { pageSchema } from '@/schemas/pageSchema';

export const classSchema = z.object({
  id: z.string(),
  name: z.string(),
  branchId: z.string(),
  teacherId: z.string().nullable(),
  studentCount: z.number(),
});

export const classPageSchema = pageSchema(classSchema);
```

```ts
// src/services/classService.ts
import { api } from '@/services/api';
import { mockApi } from '@/services/mocks/fakeBackend';
import { unwrap } from '@/services/unwrap';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/authStore';
import { classPageSchema, classSchema } from '@/schemas/classSchema';
import type { Envelope, Page, PageParams } from '@/types/api';
import type { ClassItem, CreateClassInput } from '@/types/class';

const base = (orgId: string, branchId: string) =>
  `/organizations/${orgId}/branches/${branchId}/classes`;

export async function getClasses(
  orgId: string,
  branchId: string,
  { page = 1, pageSize = 20 }: PageParams = {},
): Promise<Page<ClassItem>> {
  if (env.VITE_USE_MOCKS) {
    const token = useAuthStore.getState().token;
    return unwrap(await mockApi.getClasses(token, orgId, branchId, { page, pageSize }), classPageSchema);
  }
  const { data } = await api.get<Envelope<unknown>>(base(orgId, branchId), {
    params: { page, pageSize },
  });
  return unwrap(data, classPageSchema);
}

export async function createClass(
  orgId: string,
  branchId: string,
  input: CreateClassInput,
): Promise<ClassItem> {
  if (env.VITE_USE_MOCKS) {
    const token = useAuthStore.getState().token;
    return unwrap(await mockApi.createClass(token, orgId, branchId, input), classSchema);
  }
  const { data } = await api.post<Envelope<unknown>>(base(orgId, branchId), input);
  return unwrap(data, classSchema);
}
```

## Template: AI generation and upload (real branch shown; mock branch follows the same pattern)

```ts
import { AI_TIMEOUT_MS } from '@/config/env';

// AI lesson generation: longer per-call timeout, resolves on completion
const { data } = await api.post<Envelope<unknown>>(
  `/teachers/${teacherId}/modules/${moduleId}/lessons/generate`,
  input,
  { timeout: AI_TIMEOUT_MS },
);
return unwrap(data, lessonSchema);

// Upload: FormData, let the browser set the multipart boundary
const form = new FormData();
form.append('file', file);
const { data: uploaded } = await api.post<Envelope<unknown>>(url, form, {
  headers: { 'Content-Type': undefined },
});
return unwrap(uploaded, fileSchema);
```

## Checklist
- [ ] Type, schema, mock, service, hook all exist
- [ ] Mock and real return the same validated shape
- [ ] Mutation invalidates affected keys
- [ ] No layer skipped
