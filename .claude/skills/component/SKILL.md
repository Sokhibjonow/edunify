---
name: component
description: Use when creating or restyling a React component or page, or when adding UI primitives (Spinner, ErrorState, EmptyState, Button).
---

# Component

Design tokens live in `CLAUDE.md` (UI Design). This skill covers placement, structure and accessibility.

## Placement
- Primitive → `components/ui` • Shell/layout → `components/layout` • Feature → `components/<feature>` • Page → `pages/<role>/`
- `PascalCase.tsx`, named exports, `@/` imports.
- Pages stay thin: compose feature components, no business logic.

## Rules
- Functional + hooks only. Type props with a local `Props` type.
- Data via hooks only. Handle all 4 query states, in this order: loading → error → empty → data.
- Global state from Zustand selectors (`useAuthStore((s) => s.user)`), never prop-drilled.
- All strings via `t()`.
- Split a component when it exceeds ~150 lines or mixes data loading with heavy markup.

## Accessibility (required)
- Interactive elements are `<button>` / `<a>`, never clickable `<div>`.
- Icon-only buttons have `aria-label={t(...)}`.
- Images have `alt` (`alt=""` if decorative).
- Visible focus: `focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]`.
- Touch targets at least 40px tall on mobile.
- Lists use `<ul>/<li>`; headings follow order (`h1` per page).

## Template: page with 4 states

```tsx
// src/pages/director/ClassesPage.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { School } from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { ClassCard } from '@/components/classes/ClassCard';

export function ClassesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = useClasses(page);

  return (
    <section className="flex flex-col gap-2.5 p-3">
      <h1 className="text-[15px] font-semibold text-[var(--color-text)]">{t('classes.title')}</h1>

      {isPending ? (
        <Spinner />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={School} titleKey="classes.empty.title" hintKey="classes.empty.hint" />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {data.items.map((c) => (
              <li key={c.id}>
                <ClassCard item={c} />
              </li>
            ))}
          </ul>
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />
        </>
      )}
    </section>
  );
}
```

## Template: primitives

```tsx
// src/components/ui/Spinner.tsx
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Spinner() {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex justify-center p-3.5">
      <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-[var(--color-muted)]" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}
```

```tsx
// src/components/ui/ErrorState.tsx
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getErrorKey } from '@/utils/getErrorKey';

type Props = { error: unknown; onRetry: () => void };

export function ErrorState({ error, onRetry }: Props) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-lg border border-[var(--color-line)] p-3.5">
      <AlertCircle size={18} strokeWidth={1.8} className="text-[var(--color-danger)]" />
      <p className="text-sm text-[var(--color-text)]">{t(getErrorKey(error))}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-text)]"
      >
        {t('common.retry')}
      </button>
    </div>
  );
}
```

```tsx
// src/components/ui/EmptyState.tsx
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = { icon: LucideIcon; titleKey: string; hintKey?: string };

export function EmptyState({ icon: Icon, titleKey, hintKey }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-[var(--color-line)] p-3.5 text-center">
      <Icon size={18} strokeWidth={1.8} className="text-[var(--color-muted)]" />
      <p className="text-sm font-semibold text-[var(--color-text)]">{t(titleKey)}</p>
      {hintKey && <p className="text-sm text-[var(--color-muted)]">{t(hintKey)}</p>}
    </div>
  );
}
```
Tokens used here (`--color-muted`, `--color-danger`, `--color-accent`) must exist in `src/theme.ts`.
