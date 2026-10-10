# Conventions

These are the patterns the codebase already follows. Copy the referenced files. The binding rules are in `/home/wymx/wymx/CLAUDE.md`. Where the existing code breaks a rule (listed in `docs/TECH_DEBT.md`), follow CLAUDE.md and not the deviating file.

## Adding an endpoint (in order)

1. **Type:** `src/types/<domain>.ts`, re-exported via `src/types/index.ts` where applicable. Example: `src/types/branch.ts`.
2. **Schema:** `src/schemas/<domain>Schemas.ts`. Use the same zod schema for mock and real. Example: `src/schemas/branchSchemas.ts`, including `pageSchema()` for `Page<T>`.
3. **Mock:** add a method to the `api` object in `src/services/mocks/fakeBackend.ts`. It takes `token` as the last argument, calls a `require*` guard, and returns `Result<T>`.
4. **Service:** `src/services/<domain>Service.ts`. Use the same shape as `src/services/profileService.ts`:
   ```ts
   if (env.useMocks) {
     const token = useAuthStore.getState().token ?? ''
     return schema.parse(unwrap(await mockApi.fn(args, token)))
   }
   const res = await api.get<Envelope<T>>(`/path`)
   return schema.parse(unwrap(res.data))
   ```
   `unwrap` is copied into each service today, and consolidating it is listed in TECH_DEBT. Parse request bodies with zod before branching.
5. **Hook:** `src/hooks/use<Thing>Query.ts` or `use<Thing>Mutation.ts`, one hook per file.
   - Query example: `src/hooks/useBranchOverviewQuery.ts`. It reads ids from `useAuthStore` and sets `enabled: !!id`.
   - Mutation example: `src/hooks/useCreateBranchMutation.ts`. It explicitly invalidates the affected keys in `onSuccess`.

## Query keys

New code should use the hierarchy in CLAUDE.md, for example `['org', orgId, 'branches', branchId, 'overview']` as in `src/hooks/useBranchOverviewQuery.ts:9`. Existing flat keys such as `['branches', orgId]` are legacy, so don't copy them.

## Components

- **Pages:** `src/pages/<role>/<Role><Thing>Page.tsx`. They are thin and compose feature components. Example: `src/pages/manager/ManagerManagementPage.tsx`.
- **Feature components:** `src/components/<feature>/`. Example: `src/components/management/BranchCard.tsx`.
- **Primitives** (`src/components/ui/`):
  - `Button` (`variant: primary|secondary`, full width by default, `type="button"` by default)
  - `Card`
  - `Input` (`label` required, `error?`; pass an explicit `id`)
  - `Modal` (`title`, `onClose`; closes on Esc or backdrop click)
  - `Spinner`
  - `ConfirmDeleteModal` (3s countdown)
  - `Toaster`
- **Toasts:** `useToastStore` from `src/stores/toastStore.ts`.
- **Role dispatch:** for each shared route, add the role to the map in the matching `src/routes/Shared*.tsx`.

## Four query states

Follow `src/pages/director/ManagementPage.tsx:42-62` or `src/components/management/BranchStaffSection.tsx:53-79`:

```
isLoading → <Spinner/>
isError   → <Card> t('common.loadError') + retry button calling refetch()
empty     → t('common.empty')
data      → render
```

## Forms

Follow `src/components/auth/LoginForm.tsx` and `src/components/management/AddBranchModal.tsx`:

- controlled `useState` inputs
- `<form onSubmit>` with `preventDefault`
- validate with zod `safeParse`, then show field errors through `t()`
- call `mutation.mutate`
- disable submit while `isPending`
- show a form-level error from `ApiError`

## Styling

- Colors only as `bg-[var(--color-surface)]`, `text-[var(--color-text)]`, or `border-[var(--color-line)]`. The full token list is `ThemeColors` in `src/types/theme.ts`.
- No `dark:` variant, no default Tailwind palette, no hex values in TSX, no shadows.
- Spacing: `p-2.5`–`p-3.5`, `gap-1.5`–`gap-2.5`, `rounded-lg`, `text-sm` or `text-[15px]`.
- Icons: `<Icon size={18} strokeWidth={1.8} className="text-[var(--color-text-soft)]" />`. Example: `src/components/layout/StaffBottomNav.tsx` for the pattern (its own size of 22 is a deviation).

## i18n

- Add every key to `src/i18n/en.json`, `ru.json`, and `uz.json`. They are in sync today with 166 keys each.
- Use dot-notation namespaces such as `common.*`, `roles.*`, `appearance.tokens.*`.
- Dynamic keys are built in one place. Example: `src/utils/appearanceTokens.ts`.
- Dates and numbers go through `src/utils/formatDate.ts` (Intl).

## Imports and naming

- Always use `@/…`. There are no `../` imports anywhere today.
- Components are `PascalCase.tsx`. Hooks, services, stores, and utils are `camelCase.ts`.
- Default exports for components. Named exports for hooks and services.
