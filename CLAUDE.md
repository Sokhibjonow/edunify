# Edunify Frontend

Frontend for Edunify, a multi-tenant AI-assisted education platform. MVP only: minimal, simple, fast. No backend logic here. The app calls the Edunify API through service functions. Mock ↔ real backend switches via one env flag (`VITE_USE_MOCKS`); hooks, components and query keys never change.

These are binding rules. If a request conflicts with a rule, flag it. Don't silently comply.

## Commands
- Dev `npm run dev` • Build `npm run build` • Type-check `npx tsc --noEmit` • Lint `npm run lint` • Preview `npm run preview`
- No test suite in the MVP.

## Working Style
- Terse, directive output. No preamble or summaries unless asked.
- Minimal edits. Never rewrite whole files needlessly. Trace root cause before fixing.
- Ask before installing any package.
- No `console.log`, no TODO placeholders, no `any` without a justifying comment.
- Ambiguous task → ask batched clarifying questions (lettered multiple-choice) before coding.
- Follow the templates in skills. Once real code exists, copy patterns from the nearest existing file.

## Definition of Done
- `npx tsc --noEmit` and `npm run lint` pass
- Every new string exists in en/ru/uz
- Every query handles 4 states; every mutation invalidates affected keys
- Works at 360px width and on desktop
- Affected docs in `docs/` updated (`docs` skill)
- No rule in this file or the skills violated

## Git
- Branch per task: `feat/<name>`, `fix/<name>`, `refactor/<name>`, `chore/<name>`
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
- Never commit to `main` directly. Never commit `.env*`.

## Docs
- Keep `docs/` true to the code. Update the matching doc in the same task when a change affects architecture, domain rules, conventions or known issues.
- New shortcut or known bug → `docs/TECH_DEBT.md`. Unclear requirement → `docs/OPEN_QUESTIONS.md`.
- Read `docs/ARCHITECTURE.md` and `docs/DOMAIN.md` before large changes. Don't `@`-import docs here.
- `/update-docs` before each PR.

## Stack (strict)
Vite • TypeScript strict, `.ts`/`.tsx` only (mocks included) • React functional components + hooks (only class: top-level `ErrorBoundary`) • React Query (server state) • Zustand (client state) • Axios via service layer only • Tailwind v4 (`@tailwindcss/vite`) • zod • Lucide React • React Router • i18next + react-i18next.
NO Redux, GraphQL, WebSockets. Context only for providers (router, query client).
Backend (parity context): Node + Express + Sequelize + PostgreSQL, JWT, REST.

## Locations & Naming
- `src/types` • `src/schemas` • `src/hooks` (+ `queryKeys.ts`) • `src/stores` • `src/services` (`api.ts` = single axios instance, `unwrap.ts`, `mocks/fakeBackend.ts`)
- `src/config/env.ts` (zod env) • `src/i18n` (`en/ru/uz.json`) • `src/utils` (pure, no React) • `src/theme.ts` • `src/routes`
- `components/ui` (primitives: `Spinner`, `ErrorState`, `EmptyState`, `Toaster`…) • `components/layout` (shell + `ErrorBoundary`) • `components/<feature>`
- `pages/` by role: `edunify-admin/ director/ manager/ administrator/ teacher/ (incl. Lab) student/ parent/ auth/`
- Project docs in `docs/` (ARCHITECTURE, DOMAIN, CONVENTIONS, TECH_DEBT, OPEN_QUESTIONS, CHANGELOG)
- `@/` import alias. `PascalCase.tsx` components; `camelCase.ts` hooks/services/stores.

## Roles (exactly 7)
`edunify_admin` • `director` • `manager` • `administrator` • `teacher` • `student` • `parent`.
`authStore` holds user + JWT (+ `organizationId` + `branchId` for director/manager/administrator/teacher). Read from the store, never prop-drill. UI gating via `RequireRole` only; the backend enforces tenancy.
Gated users (director with inactive org, teacher with inactive status) see only the Pending Activation screen.
Auth MVP: no token refresh. `401` → session cleared → login.

## Architecture
Component → React Query hook → Service function → Transport (axios or mock). No layer skips a level.
Mocking lives only in `fakeBackend.ts` and the mock branch of services. Never in hooks, components or stores.

## State
- Server state → React Query only. Never duplicate into Zustand.
- Client state (auth, UI prefs, theme, modals, toasts) → small focused Zustand stores, no mega-store. Local → `useState`/`useReducer`.
- `persist` name = filename minus `Store` (`themeStore.ts` → `'theme'`). `authStore` is persisted.
- Language lives in i18next + `localStorage`, not Zustand. Toasts = `toastStore` + `ui/Toaster`.

## TypeScript
- Prefer inference; type public APIs/props. Simplest correct solution.
- No inline `style` except truly dynamic values.
- Every query handles 4 states: loading (`Spinner`) / error (`ErrorState` + `refetch`) / empty (`EmptyState`) / data.

## i18n
Every user-facing string via `t()`, present in en/ru/uz.

## UI Design (single source of truth for tokens)
- Mobile-first, border-based (no shadows as layout), `rounded-lg`, tight spacing (`p-2.5`–`p-3.5`, `gap-1.5`–`gap-2.5`, `my-3`–`my-4`).
- Colors only via CSS vars: `text-[var(--color-text)]`, `bg-(--color-surface)`, `border-[var(--color-line)]`. Never Tailwind default or hardcoded colors.
- Theme is JS-driven (`applyTheme` + `useThemeStore`, tokens in `src/theme.ts`). No `dark:`, no static `@theme`.
- Lucide only: `size={18}` `strokeWidth={1.8}`, color via `className`.
- Text `text-sm`/`text-[15px]`; `font-normal` body, `font-semibold` headings.

## Skills (load on demand)
`api-endpoint` • `api-client` • `query-hooks` • `forms` • `component` • `routing` • `zustand-store` • `error-handling` • `i18n` • `domain-model` • `mock-data` • `project-setup` • `docs`
Agents: `reviewer` • `type-fixer` • `i18n-auditor` • `ui-verifier` • `a11y-auditor`
Commands: `/review` • `/update-docs`
