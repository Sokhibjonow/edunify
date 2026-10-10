---
name: api-client
description: Use when editing src/services/api.ts, interceptors, ApiError, the mock/real switch, JWT handling, or src/config/env.ts.
---

# Axios Instance & Mock Parity

## Rules
- One axios instance. baseURL from `src/config/env.ts` (never `import.meta.env` inline).
- Request interceptor: attach `Authorization: Bearer <token>` from `authStore`; skip when null.
- Response interceptor:
  - `401` → clear session + redirect to login via the router ref (never `window.location`). No token refresh in the MVP.
  - `403` and other 4xx/5xx → normalize to `{ ok: false, error, status }` and **resolve** (don't reject).
  - **Never** clear the session on `403`.
  - Network error / timeout (no response) → normalize with `status: 0`.
- `ApiError` class `{ message, status }` is exported from `api.ts`.

## Mock / Real parity
- Mocking lives ONLY in `fakeBackend.ts` and the mock branch of service functions.
- Contract first: types (`src/types`) + zod schemas (`src/schemas`); both transports return the same validated shape.
- `VITE_USE_MOCKS` toggles mock vs real inside each service function. Nothing else changes.
- The mock issues a fake JWT on `login`, validates it on protected endpoints, and simulates role-based gating.

## Template: env

```ts
// src/config/env.ts
import { z } from 'zod';

const schema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_USE_MOCKS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

export const env = schema.parse(import.meta.env);

export const API_TIMEOUT_MS = 15_000;
export const AI_TIMEOUT_MS = 120_000;
```

## Template: router ref

```ts
// src/routes/navigation.ts
type Navigate = (to: string, opts?: { replace?: boolean }) => void;

let navigateRef: Navigate | null = null;

export const setNavigate = (fn: Navigate) => {
  navigateRef = fn;
};

export const navigateTo = (to: string) => {
  navigateRef?.(to, { replace: true });
};
```
Register once inside the router tree: `const navigate = useNavigate(); useEffect(() => setNavigate(navigate), [navigate]);`

## Template: api.ts

```ts
// src/services/api.ts
import axios, { AxiosError } from 'axios';
import { env, API_TIMEOUT_MS } from '@/config/env';
import { useAuthStore } from '@/stores/authStore';
import { navigateTo } from '@/routes/navigation';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string }>) => {
    const status = err.response?.status ?? 0;

    if (status === 401) {
      useAuthStore.getState().logout();
      navigateTo('/login');
    }

    return Promise.resolve({
      ...err.response,
      data: { ok: false, error: err.response?.data?.error ?? err.message, status },
    });
  },
);
```

## Mock transport
Handlers live in `fakeBackend.ts` and return `Envelope<unknown>` (full template in the `mock-data` skill).
The mock returns `401` envelopes itself; `unwrap` throws `ApiError(…, 401)` and the global `QueryCache`/`MutationCache` handler (see `query-hooks`) logs the user out. Behaviour matches the real path.
