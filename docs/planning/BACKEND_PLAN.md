# Backend plan

**Goal:** a real backend for the existing frontend. The frontend is finished and runs on mocks (`VITE_USE_MOCKS=true`). The backend must return exactly the shapes in [`../apiContract.md`](../apiContract.md), so that switching to `VITE_USE_MOCKS=false` needs **no change** in components, hooks, query keys or schemas.

| | |
|---|---|
| Backend repo | `D:\edunify-backend` (Node 22, Express 4, Sequelize 6, PostgreSQL 16, JWT, zod, multer) |
| Base URL | `http://localhost:3000/api` (`VITE_API_URL`) |
| Contract (source of truth) | [`docs/apiContract.md`](../apiContract.md) |
| Mock reference implementation | `src/services/mocks/fakeBackend.ts`: same rules, in memory |

---

## 1. Rules for both sides

These keep the frontend comfortable: one shape, predictable errors.

1. **Envelope everywhere.** `{ ok: true, data }` or `{ ok: false, error, status }`, with the HTTP status matching `status`.
2. **Status codes.** `400` validation, `401` no/invalid token, `403` role or tenancy, `404` not found, `409` conflict (duplicate email, already in class).
3. **Lists.** Paginated lists return `{ items, page, pageSize, total }` with `page`/`pageSize` query params (default `1`/`20`, max `100`). Small bounded lists (tasks, homework per lesson) return a plain array. The contract says which.
4. **IDs are strings.** Users and branches use Connect Codes `XXX-XXX-XXX`. Classes, modules, lessons, tasks and homework use UUIDs. The frontend never parses IDs.
5. **Dates** are ISO 8601 strings in UTC.
6. **Passwords** are never returned. The only exception: generated student credentials are returned **once** from the create/reset endpoints.
7. **File URLs** are absolute (`PUBLIC_URL` + `/uploads/...`), so `<img src>` works from any frontend origin.
8. **Every response is validated on the frontend** with the shared zod schema in `src/schemas`. A field missing on the backend fails loudly in dev instead of rendering `undefined`.
9. **Access is checked on the backend.** Frontend `RequireRole` only hides UI.

---

## 2. Phases

### Phase 1: teacher classroom (current)

Everything needed for the teacher profile, plus the session basics every role needs.

| Area | Endpoints | Status |
|---|---|---|
| Auth | `POST /auth/login`, `POST /auth/signup`, `GET /auth/me`, `GET /auth/active-organization` | Done |
| Profile | `GET /profile`, `PATCH /profile`, `PATCH /profile/password` | Done |
| Connection | `GET /connection/status`, `POST /connection/request` | Done |
| Organization | `GET /orgs/:orgId`, `PATCH /orgs/:orgId/theme`, `PATCH /orgs/:orgId/logo` | Done |
| Teacher classes | `GET /teachers/:teacherId/classes`, `POST /teachers/:teacherId/classes`, `GET /classes/:classId` | Done |
| Curriculum | `GET /classes/:classId/modules`, `POST /classes/:classId/modules`, `POST /modules/:moduleId/lessons` | Done |
| Tasks | `GET /classes/:classId/tasks`, `POST /classes/:classId/tasks` | Done |
| Homework | `GET /classes/:classId/homeworks?lessonId=`, `POST /classes/:classId/homeworks` (student, photos), `PATCH /homeworks/:homeworkId/review` | Done |
| Students | `GET /classes/:classId/students`, `GET /classes/:classId/students/lookup?uniqueId=`, `POST /classes/:classId/students/link`, `POST /classes/:classId/students`, `POST /classes/:classId/students/:studentId/reset-password` | Done |

### Phase 2: student profile (done)

| Item | Status |
|---|---|
| `GET /students/:studentId/classes`: the student's classes | Done |
| Student home: their ID with a copy button (given to the teacher), class list that refreshes itself while empty | Done |
| Student class page: same sidebar and tabs as the teacher, read-only. In the Homework tab: the lesson assignment, their own submission with its status, the photo + comment form, re-submit until reviewed | Done |
| Own submission | No separate endpoint: `GET /classes/:classId/homeworks?lessonId=` already returns only the caller's submission when the caller is a student. |

### Phase 3: director / manager / administrator (done)

| Area | Endpoints | Status |
|---|---|---|
| Branches | `GET/POST /orgs/:orgId/branches`, `PATCH/DELETE .../:branchId` (delete refuses with `409` while the branch has classes), `GET .../student-counts` | Done |
| Managers | list, assign by ID + name check (director), remove (director) | Done |
| Administrators, teachers | list, assign by ID, remove (director or staff of that branch). Removing a teacher detaches them from the branch's classes and returns their modules to their Lab | Done |
| Dashboards | `GET .../:branchId/statistics?from&to`, `GET .../:branchId/overview`. Director and branch staff only. Computed from real rows, nothing synthesized | Done |
| Data | New tables `attendance` and `payments`. `class_students.createdAt` = enrollment date (monthly history) | Done |

Self-registered teachers, administrators and managers are now linked by their ID from the management screens. Once linked, a teacher can create classes.

### Attendance register (done)

| Item | Status |
|---|---|
| `GET` / `PUT /classes/:classId/attendance`: one register per class per day, saved as a whole | Done |
| Teacher UI: Lessons tab → register under the lesson card, with a date picker (no future dates), four statuses, "All present", and a warning when the day was taken for another lesson | Done |
| A saved register clears the teacher from "pending attendance" on the manager home and feeds attendance statistics | Done |
| "Today" is computed in `APP_TIMEZONE` (default `Asia/Tashkent`) and stored in `attendance.date` | Done |

### Payments (done)

| Item | Status |
|---|---|
| Model: `payments` stores only money received (partial payments add up). Charges are derived from enrollments × `classPrice` × month, due on `BILLING_DUE_DAY` | Done |
| `GET/POST/DELETE /orgs/:orgId/branches/:branchId/payments`: month view, accept a payment, undo a mistaken entry | Done |
| Manager UI `/payments`: month switcher, collected/expected summary, To collect / Paid / All filters, search, class filter, accept-payment form (amount, date, note), per-line payment history with undo | Done |
| Manager home debtors and statistics (`paymentCounts`, revenue) use the same billing calculation | Done |

### Branch classes (done)

| Item | Status |
|---|---|
| `GET/POST/PATCH/DELETE /orgs/:orgId/branches/:branchId/classes` for director and branch staff | Done |
| Fee history (`class_prices`): a new fee applies from this or next month; past months keep their fee; billing and statistics read the fee per month | Done |
| Manager UI `/classes`: list with teacher, students and fee (plus scheduled change), create/edit form (name, fee, "applies from", teacher with a warning when it changes), delete (refused while the class has students or payments) | Done |

### Branch students (done)

| Item | Status |
|---|---|
| `GET /orgs/:orgId/branches/:branchId/students`: classes, 30-day attendance, outstanding/overdue amounts, unpaid months | Done |
| `GET .../students/lookup`, `POST .../students/enroll`: staff enroll a self-registered student by ID into any class of the branch | Done |
| Manager UI `/students`: overdue total, All / With debt / Low attendance (< 70%) filters, search by name or ID, class filter, student card (contacts with copy, classes, attendance breakdown, unpaid months with a jump to that month on `/payments`), "Add student" by ID | Done |

All five sections of the manager's bottom navigation are now live on the backend.

### Director pages (done)

| Item | Status |
|---|---|
| `/payments`, `/classes`, `/students` for the director: the same screens as the manager, with a branch picker. The branch is kept in `?branch=` across these pages, the bottom navigation and the student card's "Go to payments" | Done |
| Director bottom navigation (Home, Management, Payments, Classes, Students) on the home and management pages too | Done |
| Frontend: page bodies moved into `components/payments/BranchPaymentsView`, `components/classes/BranchClassesView`, `components/students/BranchStudentsView` (take `orgId` + `branchId`). Manager pages read the branch from the profile; director pages use `components/layout/DirectorBranchPage` | Done |

No backend change: these endpoints already allowed the director.

### Administrator pages (done)

The administrator works in one branch with the same rights as its manager, except managing managers. Its home (branch dashboard), `/management` (administrators and teachers), `/payments`, `/classes` and `/students` reuse the manager pages; the routes map `administrator` to them. A staff member sees "You" instead of a delete button on their own row, and the backend refuses self-removal (`400`).

### Parent pages (done)

| Item | Status |
|---|---|
| `parent_children` table (`parentId`, `studentId`, `linkedBy`, `createdAt`) | Done |
| Staff (director, branch manager/administrator): `GET/POST/DELETE .../students/:studentId/parents`, `GET .../parents/lookup`. Linking makes the parent `connected`; removing the last link makes them `unconnected` | Done |
| Parent: `GET /parents/:parentId/children`, `GET /parents/:parentId/children/:studentId` (classes, attendance, homework, payments; read-only). `assertOrgAccess` lets a parent read the org of a linked child | Done |
| UI: parent home (own ID + children, polled every 15 s while empty), child page `/children/:studentId`, "Parents" section in the staff student card | Done |
| Seed: `parent@bfa.uz` (PAR-BFA-001) with two children in two branches; `PAR-NEW-001` unlinked for demos | Done |

### Removing a student from a class (done)

| Item | Status |
|---|---|
| `class_students` holds one row per stay (`id`, `createdAt` joined, `leftAt`, `removedBy`); at most one current stay per student and class | Done |
| `DELETE /classes/:classId/students/:studentId` for the class teacher and branch staff; same-day removal without payments undoes the enrollment | Done |
| Billing and statistics count a student in every month a stay covers (`services/enrollment.ts` → `coversMonth`); access, rosters, registers and counts use current stays only | Done |
| Staff list keeps former students who still owe money (no classes, "Left all classes"); parent page keeps the history of classes the child left | Done |
| UI: remove button in the teacher's roster and on class chips in the staff student card, with an inline confirmation | Done |

**Still mock-only:** ratings.

### Phase 4: hardening

Sequelize migrations instead of `sync({ alter })`, rate limiting on `/auth/*`, image resizing for homework photos, S3-compatible storage, refresh tokens.

---

## 3. Data model (PostgreSQL)

```
organizations ─┬─< branches ─┬─< classes ─┬─< class_students >── users (student)
               │             │            ├─< modules ─< lessons
               │             │            ├─< tasks
               │             │            └─< homework_submissions >── users (student)
               └─< users (org-scoped roles: organizationId / branchId)
```

| Table | Key columns | Notes |
|---|---|---|
| `users` | `uniqueId` (Connect Code, unique), `email` (unique), `passwordHash`, `role`, `organizationId?`, `branchId?`, `connectionStatus?`, `requestedBranchId?`, `classCategory?`, `activationStatus?`, `statistics` (JSONB) | One table for all roles. |
| `organizations` | `id`, `name`, `ownerId`, `logoUrl`, `activationStatus`, `joinCode`, `lightTheme`/`darkTheme` (JSONB, 21 CSS vars each) | New orgs get the default palettes. |
| `branches` | `id` (Connect Code), `organizationId`, `name` | |
| `classes` | `id` (UUID), `organizationId`, `branchId`, `name`, `teacherId?`, `classPrice`, `joinCode` | `studentIds` in responses comes from `class_students`. |
| `class_students` | `id` PK, `classId`, `studentId`, `createdAt` (joined), `leftAt?`, `removedBy?` | One row per stay; at most one current (`leftAt` null) per pair. `studentId` = student `uniqueId`. |
| `modules` | `id`, `teacherId`, `classId?`, `title` | `classId = null` = teacher's Lab only. |
| `lessons` | `id`, `moduleId`, `title`, `order` | Returned embedded in `Module.lessons`, sorted by `order`. |
| `tasks` | `id`, `classId`, `lessonId?`, `title`, `description`, `dueDate?`, `priority` (`normal`/`important`), `createdBy` | |
| `homework_submissions` | `id`, `classId`, `lessonId`, `studentId`, `comment`, `photos` (JSONB array of paths), `status` (`submitted`/`reviewed`/`late`), `submittedAt` | Unique (`lessonId`, `studentId`): re-submitting replaces it. `studentName` is joined from `users` in responses. |
| `chat_messages` | `classId`, `senderId`, `text` | Exists on the backend, not used by the frontend yet. |

---

## 4. Access rules (Phase 1)

| Guard | Who passes |
|---|---|
| `auth` | any valid JWT |
| `teacherSelf(:teacherId)` | the teacher whose `uniqueId` is in the path |
| `classMember(:classId)` | the class teacher, a student of the class, staff of the class branch, the org director, `edunify_admin` |
| `classTeacher(:classId)` | only the teacher assigned to the class |
| `classStudent(:classId)` | only a student enrolled in the class |

Linking a student by ID: the student must exist with role `student`, and must not belong to **another** organization. On link, the student becomes `connected` to the class organization and branch.

---

## 5. Running it

```bash
# backend (D:\edunify-backend)
npm install
npm run seed      # drops and recreates all tables with demo data
npm run dev       # http://localhost:3000/api

# frontend (edunify-main) against the real backend, on port 5174
npm run dev:real
```

`npm run dev` on the frontend keeps using mocks on port 5173, so both can run side by side.

### Production (Vercel, account `sokhibjonow`)

| | URL | Vercel project | Source |
|---|---|---|---|
| Site | https://edunify-web.vercel.app | `edunify-web` | `edunify-main/` (static Vite build, SPA rewrite in `vercel.json`) |
| API | https://edunify-api.vercel.app/api | `edunify-api` | `D:\edunify-backend` (`api/index.ts` serves `src/expressApp.ts`) |

- **Database:** Neon (Free plan, Frankfurt), connected to `edunify-api`; it sets `DATABASE_URL`. Started empty: schools sign up themselves. Missing tables are created on a cold start (`ensureSchema`, plain `sync()`), which never alters existing tables, so **a model change needs a manual migration in production** until Phase 4.
- **Files:** Vercel Blob store `edunify-files` (public, Frankfurt) sets `BLOB_READ_WRITE_TOKEN`; homework photos and logos are stored there. Locally files still go to `uploads/`.
- **Env on `edunify-api`:** `JWT_SECRET` (random), `APP_TIMEZONE`, `NODE_ENV`, `FRONTEND_URL=https://edunify-web.vercel.app`. On `edunify-web`: `VITE_API_URL`, `VITE_USE_MOCKS=false`.
- **Limits:** a request body is at most 4.5 MB on Vercel; the frontend shrinks photos before upload (`src/utils/compressImage.ts`). Functions run in `fra1`.
- **Deploy:** no git integration yet. From each folder: `npx vercel deploy --prod`.

Seeded accounts use the same emails as the mock, all with password `Pass1234!`:

| Role | Email |
|---|---|
| director | `komiljon@bfa.uz` |
| managers | `manager@bfa.uz` (Chilonzor), `manager2@bfa.uz` (Yunusobod) |
| administrator | `administrator@bfa.uz` (Chilonzor) |
| teacher (class *English A1 · Morning*, Chilonzor) | `teacher@bfa.uz` |
| teacher (class *Math 5A*, Yunusobod; register missing today → "pending" on the manager home) | `teacher2@bfa.uz` |
| self-registered staff, not linked yet | teacher `TCH-NEW-001`, administrator `ADM-NEW-001`, manager `MGR-NEW-001` (*Farhod Nurmatov*) |
| students in that class | `student@bfa.uz`, `student2@bfa.uz`, `aziza.karimova@edunify.uz`, `bekzod.toshmatov@edunify.uz`, `dilnoza.rahimova@edunify.uz`, `jasur.aliyev@edunify.uz` |
| self-registered students, no class yet | IDs `K7M-2QX-9DP`, `R4T-8WN-3LB` (`nodira.ergasheva@edunify.uz`, `timur.nazarov@edunify.uz`) |

---

## 6. Checklist for every new endpoint

1. Add it to `apiContract.md`: method, path, guard, request, response, errors.
2. Frontend: type → zod schema → mock handler → service (mock + real branch) → hook.
3. Backend: zod input validation → guard → handler returning the contract shape.
4. Run the flow once with `npm run dev:real` and once with mocks. Both must look identical.
5. Update the status table in this file.
