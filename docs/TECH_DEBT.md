# Tech debt

Snapshot as of 2026-10-04, ranked by severity. **P0** blocks the build or is a correctness/security risk. **P1** is a real bug or a violation of a binding rule. **P2** is consistency or cleanup.

## Verification results

The checks were run after `npm ci`:

| Check | Result |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | PASS (it failed with 16 errors until `themeSchemas.ts` was restored on 2026-10-04) |
| `npm run lint` | **FAIL**: 2 errors, `react-hooks/set-state-in-effect` at `src/components/profile/ProfileView.tsx:51` and `src/components/ui/ConfirmDeleteModal.tsx:29` |
| `npm run build` | PASS, but one chunk is 1,002 kB (326 kB gzip), over Vite's 500 kB warning |
| `npm audit` | 7 vulnerabilities (6 high, 1 moderate). Affected packages include `postcss` and `nanoid`. `npm audit fix` is available. |
| Tests | none exist |

## Backend (`D:\edunify-backend`, added 2026-10-06)

- **P1** Schema is created with `sequelize.sync({ alter: true })` on startup; there are no migrations. `npm run seed` drops every table. Plan: Phase 4 in `planning/BACKEND_PLAN.md`.
- **P1** Production (Vercel + Neon) only creates missing tables on a cold start. Any change to an existing model (new column, index) is **not** applied there: it needs a migration run against the production DB by hand.
- **P2** Deploys are manual (`npx vercel deploy --prod` from each folder); neither project is in git, so there is no history, review or rollback by commit. Each Vercel deployment can still be promoted back in the dashboard.
- **P2** HEIC photos can't be shrunk outside Safari, so they are uploaded as they are and five large ones can exceed Vercel's 4.5 MB request limit.
- **P2** The mock keeps no fee history: a fee change applies to every month in mock mode. A scheduled change is only shown, not billed.
- **P2** The mock student list bills only the previous and current month, because mock classes have almost no payment history. The backend bills every month since enrollment.
- **P2** The mock keeps no enrollment history: removing a student just drops them from `studentIds`, so their months in that class are no longer billed in mock mode. The backend keeps every stay.
- **P2** Re-saving a past attendance register after a student left drops that student's mark for that date, because the roster shows current students only.
- **P2** Students do not see their own attendance. The register endpoint is teacher/staff only; a student view needs its own endpoint.
- **P2** Monthly statistics take membership history from `createdAt`. A removed teacher or student also disappears from past months.
- **P2** Mock statistics still synthesize missing history (`monthHash` in `fakeBackend.ts`), so mock and backend numbers differ for the same period.
- **P2** `src/controllers/classController.ts` and `src/routes/classes.ts` are legacy code: unmounted and without tenancy checks. They are fully replaced by `branchClassController.ts` and should be deleted by hand. The agent's tooling cannot delete files outside the frontend project.
- **P2** Only branch staff can link a parent to a child, so a parent needs the school's help. Self-service would need a one-time code that the student or staff hands out; a plain student ID is not enough, because anyone who knows it could see the child's data. A parent of children in two orgs sees both, but has no org of their own.
- **P2** The parent overview builds billing for every branch of the child on each request (`branchBillingLines` over all months). Fine for MVP sizes; needs a per-student query once branches grow.
- **P2** In mock mode, hot-reloading `fakeBackend.ts` rebuilds the dataset with different user IDs, so the stored session becomes invalid and you have to log in again. This only affects dev.

## P0

1. ~~The build was broken by an incomplete `src/schemas/themeSchemas.ts`.~~ **Resolved 2026-10-04:** `THEME_COLOR_KEYS`, `themeColorsSchema` and `defaultLightTheme` were restored. The original light values were lost, so `defaultLightTheme` is a **new palette**.
2. **Mock backend and faker ship in production.**
   - All 7 services statically import `@/services/mocks/fakeBackend`, and `@faker-js/faker` is in `dependencies`.
   - The `env.useMocks` check happens at runtime, so the bundler can't remove the mock.
   - The seeded fake DB, including demo credentials and fake-JWT secret logic, is generated when the module loads in production.
   - The whole app is one 1,002 kB chunk (326 kB gzip). How much of that is faker is UNVERIFIED.
3. **Logout leaks cache between users.**
   - `src/hooks/useLogout.ts:12` removes only `['auth','me']`.
   - `['profile']`, `['connection','status']`, org, branch, and statistics data remain for the next user on the same device.
   - Use `queryClient.clear()`. The 401 path in `api.ts` and `AuthBootstrap.tsx` also doesn't clear the cache.
4. **No `ErrorBoundary`.** A render error white-screens the app. CLAUDE.md requires one in `components/layout`.

## P1

5. **Lists silently truncate at 20 items.**
   - `src/services/branchService.ts:20,23,40,43,123,126,136,139` return `.items` and drop `page`/`total`. No page params are sent.
   - `statisticsService.getStatistics` aggregation inherits this, so org-wide stats are wrong for orgs with more than 20 branches.
6. **`RequireRole` ignores `role`** (`src/routes/RequireRole.tsx:14`). It only allows guests through. Per-role access relies on the `Shared*` dispatchers.
   - This differs from the CLAUDE.md description of RequireRole.
   - There is also no catch-all `*` route, so unknown URLs render blank.
7. **In mock mode, a 401 doesn't log the user out except on `/auth/me`.** Mock calls bypass the axios interceptor, so the session is cleared only by `AuthBootstrap.tsx:30-35`. This breaks the mock/real parity requirement.
8. **Query keys don't follow the hierarchy.**
   - Most keys are flat, for example `['branches',orgId]`, `['branchManagers',orgId,branchId]`, `['statistics',...]`.
   - Missing invalidations:
     - create, delete, and update branch don't invalidate `branchStudentCounts` or `statistics`
     - delete branch doesn't invalidate that branch's administrators or teachers
     - `useUpdateOrganizationThemeMutation` doesn't invalidate `['activeOrganization']`
     - manager/administrator assign and remove don't invalidate `['org',orgId]` or `statistics`, while the teacher versions do
   - `useCurrentUserQuery.ts:28` invalidates `['connection','status']` inside `queryFn`, which is a side effect.
9. **Language is a Zustand store** (`src/stores/languageStore.ts`), which breaks a CLAUDE.md rule. `src/i18n/index.ts:7-15` parses Zustand's internal `{state:{language}}` format from localStorage, so there are two sources of truth with a coupled format.
10. **The domain model contradicts the documented rules:**
    - Self-signup creates an active director and an active teacher, so there is no approval.
    - Director gating uses `directorActivationStatus` instead of the org's `activationStatus`.
    - `joinClassByCode` (`fakeBackend.ts:1822`) requires the student's `organizationId`, which self-signed-up students never have. It probably always returns 403.
    - The `signup` comment (:1155-1161) contradicts the code.
11. **`resolveActiveOrganization` diverges between mock and real** (`src/services/orgService.ts:30-40`). The real path short-circuits to `getOrg(user.organizationId)`, while the mock always calls `resolveUserOrg`.
12. **Untranslated backend errors are shown to users.** Six components render `mutation.error.message` directly: `AddManagerModal.tsx:21`, `AddBranchModal.tsx:20`, `SignupForm.tsx:74`, `AddBranchStaffModal.tsx:30`, `EditBranchNameModal.tsx:21`, `OrganizationConnectionPage.tsx:26`. The `'Request failed'` fallback in `api.ts:46` is also English.
13. **`env.ts` requires `VITE_API_URL` even when mocks are on.** The app throws at import if it is unset.
14. **The lint errors** (setState in an effect): `ProfileView.tsx:51` and `ConfirmDeleteModal.tsx:29`.
15. **Teacher and student have no connection UI**, although the backend supports it. Only manager and administrator homes use `RoleHomeWithConnection`. A parent does not connect by branch ID: staff link them to a child, and the parent home shows the ID to hand over.

## P2

16. **Duplication:**
    - `unwrap()` is copied into 7 services. It should move to `src/services/api.ts`.
    - The Assign/Remove/Query hooks for managers, administrators, and teachers are 9 near-identical files.
    - `AddManagerModal` and `AddBranchStaffModal` are near-duplicates, and so are `DeleteManagerModal` and `DeleteBranchStaffModal`.
    - `AddBranchStaffModal.tsx:23-24` and `DeleteBranchStaffModal.tsx:27-28` create two mutations and use one.
    - The retry button is hand-copied in 8 files.
17. **Primitive underuse:** there are about 50 raw `<button>`s against 9 `Button` importers, because `Button` is hard-coded `w-full` (`Button.tsx:29`) and has no danger variant. `Input` falls back to the label as its `id` (`Input.tsx:9`), so ids can contain spaces or repeat.
18. **Modal accessibility:** no focus trap, no portal, no `aria-labelledby` (`src/components/ui/Modal.tsx`).
19. **Design-rule deviations:**
    - 13 icons are not `size={18}`: sizes 14, 16, 22, and 48 in `StatisticsMetrics`, `ProfileView`, `ManagerRow`, `BranchStaffRow`, `ManagementPage`, `BranchCard`, `BranchStaffSection`, `StatisticsCard`, `StaffBottomNav`, and the `Delete*Modal`s.
    - `shadow-sm` in `Toaster.tsx:18`.
    - `LanguageSwitcher.tsx:58` has an untranslated `aria-label`.
20. **Four-state gaps:**
    - `RoleHomeWithConnection.tsx:23-41` handles loading only.
    - `HomeOverview.tsx:14-30` ignores errors from the student-count query and has no empty state.
    - `ManagerHome.tsx:55` and `StatisticsCard.tsx:130` show "no data" as an error.
21. **Leftovers:**
    - `src/App.css` is empty but still imported (`App.tsx:1`).
    - CSS class names with no styles: `home-page`, `toaster`, …
    - Unused exports: `orgBrandingSchema`, `isConnectCode`, the `Api` type, plus about 31 exports that could be file-local.
    - The package is named `edunova`.
    - `README.md` is still the Vite template.
    - `ManagementPage.tsx` lacks the `Director` prefix.
22. **Theme tokens have no CSS fallback.** `src/index.css` defines no defaults, so colors depend on JS running first. Whether this causes a visible flash is UNVERIFIED.
23. **No tests.** There is no runner in `package.json`. CLAUDE.md accepts this for the MVP.
24. **Naming drift:** `org_owner` still appears in `fakeBackend.ts` comments and errors, and in `docs/apiContract.md`.
