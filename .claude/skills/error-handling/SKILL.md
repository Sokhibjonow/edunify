---
name: error-handling
description: Use when showing API errors, choosing toast vs inline error, handling 401/403/404/network failures, or editing ErrorBoundary and the pending/forbidden/not-found screens.
---

# Error Handling

## Where errors go
| Situation | UI |
|---|---|
| Query failed | Inline `ErrorState` with retry (`component` skill) |
| Mutation failed inside a form | Form-level error under the fields |
| Mutation failed outside a form (delete, assign, connect) | Error toast |
| Mutation succeeded | Success toast (forms may reset instead) |
| `401` | Session cleared + `/login` (axios interceptor for real, QueryCache/MutationCache handler for mock; see `query-hooks`) |
| `403` | Inline message `errors.forbidden`. Never logout |
| `404` on a detail page | Inline `errors.notFound` + link back |
| Inactive director / teacher | `/pending` screen (`routing` skill) |
| Render crash | Top-level `ErrorBoundary` fallback with reload button |

## Rules
- Never show raw server messages. Map every error to an i18n key with `getErrorKey`.
- Never swallow errors silently. Never `console.log` them.
- One error source per action: don't show both a toast and an inline message.
- Every `errors.*` key exists in en/ru/uz.

## Template: error → i18n key

```ts
// src/utils/getErrorKey.ts
import { ApiError } from '@/services/api';

export function getErrorKey(err: unknown): string {
  if (!(err instanceof ApiError)) return 'errors.unknown';
  if (err.message.startsWith('errors.')) return err.message; // client-side keys, e.g. invalidResponse

  switch (true) {
    case err.status === 0:
      return 'errors.network';
    case err.status === 400 || err.status === 422:
      return 'errors.validation';
    case err.status === 403:
      return 'errors.forbidden';
    case err.status === 404:
      return 'errors.notFound';
    case err.status === 409:
      return 'errors.conflict';
    case err.status >= 500:
      return 'errors.server';
    default:
      return 'errors.unknown';
  }
}
```
`utils` must stay React-free; this file only imports the `ApiError` class.

## Template: mutation outside a form

```ts
const toast = useToastStore((s) => s.show);
const { mutate } = useUnassignTeacher();

mutate(vars, {
  onSuccess: () => toast({ type: 'success', messageKey: 'classes.teacherUnassigned' }),
  onError: (err) => toast({ type: 'error', messageKey: getErrorKey(err) }),
});
```

## Template: ErrorBoundary (the only class component)

```tsx
// src/components/layout/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';
import { ErrorFallback } from '@/components/layout/ErrorFallback';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? <ErrorFallback /> : this.props.children;
  }
}
```
`ErrorFallback` is a function component (so it can use `t()`) with a reload button.

## Required i18n keys
`errors.unknown`, `errors.network`, `errors.validation`, `errors.forbidden`, `errors.notFound`, `errors.conflict`, `errors.server`, `errors.invalidResponse`, `common.retry`, `common.reload`.
