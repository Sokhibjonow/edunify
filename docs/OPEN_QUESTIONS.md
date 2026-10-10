# Open questions

These are things that are unverified or ambiguous. Answer them, then move the answers into the relevant doc.

## Needs an owner decision

1. **Default light palette.** `defaultLightTheme` in `src/schemas/themeSchemas.ts` was rewritten on 2026-10-04 because the original values were lost. Does it need design review?
2. **Approval model.** Should a self-signed-up director or teacher start as `pending` and need `edunify_admin` approval? The mock currently activates both on signup. `docs/context.md:153` ("Approval over payment") suggests they should not be auto-activated.
3. **Director gating field.** CLAUDE.md says to use the org's `activationStatus`, but the code uses `directorActivationStatus`. Which one is the backend's source of truth?
4. **Joining.** CLAUDE.md says "by ID only, no join codes", but `docs/context.md:105-107` mentions join codes, and `Organization.joinCode` and `Class.joinCode` exist in the mock. Should the join codes be removed? Should students join with the class `id` or the `joinCode`?
5. **Connection for teacher, student, and parent.** Should these roles get the branch-ID connection request UI that managers and administrators have? According to CLAUDE.md, students and parents aren't org-scoped at all, yet the mock gives them `connectionStatus` and `requestedBranchId`.
6. **`RequireRole` semantics.** Keep it as a guest-only landing guard, or turn it into a real role guard as CLAUDE.md describes?
7. **Language store.** Replace `src/stores/languageStore.ts` with plain i18next and localStorage, as CLAUDE.md requires?
8. **`npm audit` findings** (6 high). Is it OK to run `npm audit fix`?

## Unverified technical facts

9. How much of the 1,002 kB bundle is faker and fakeBackend. This has not been measured.
10. The real backend's error body shape (`{ error }` vs `{ message }`). `api.ts:46` accepts both.
11. The real backend's pagination contract. Does it really default to `pageSize=20`?
12. Whether a theme flash (FOUC) is visible, since `src/index.css` defines no CSS fallback tokens.
13. Whether `joinClassByCode` always returns 403 for self-signed-up students (`fakeBackend.ts:1822`). This was not exercised at runtime.
14. Whether manager/administrator assign/remove should also refresh `['org',orgId]` and statistics as the teacher versions do, or whether the teacher versions over-invalidate.
15. Whether unstyled class names (`home-page`, `toaster`, …) are hooks for something external such as e2e selectors.
16. Real `VITE_API_URL` for dev and prod. `.env.development` and `.env.example` were added on 2026-10-04 with a placeholder `http://localhost:3000/api` and mocks on. There is no `.gitignore`, so check before committing any `.env*` file.
17. Git state: only `LICENSE` and `README.md` are tracked, and everything under `src/` is untracked. Is that intended, or is the code waiting for a first commit?
