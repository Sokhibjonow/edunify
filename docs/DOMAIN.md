# Domain

Snapshot as of 2026-10-04. Sources: `src/types/*`, `src/schemas/*`, `src/services/mocks/fakeBackend.ts` (the most complete model), `docs/context.md`, `docs/apiContract.md`. Line refs below are to `fakeBackend.ts` unless noted.

## Hierarchy

```mermaid
erDiagram
  ORGANIZATION ||--o{ BRANCH : has
  ORGANIZATION ||--|| DIRECTOR : "ownerId"
  BRANCH ||--o{ CLASS : owns
  BRANCH ||--o{ MANAGER : staff
  BRANCH ||--o{ ADMINISTRATOR : staff
  BRANCH ||--o{ TEACHER : staff
  CLASS }o--o| TEACHER : "teacherId | null"
  CLASS }o--o{ STUDENT : "studentIds / classIds"
  PARENT }o--o{ STUDENT : "parent_children (linked by staff)"
  TEACHER ||--o{ MODULE : owns
  MODULE }o--o| CLASS : "classId | null (Lab only)"
  MODULE ||--o{ LESSON : contains
  CLASS ||--o{ PAYMENT : ""
  CLASS ||--o{ ATTENDANCE : ""
  CLASS ||--o{ RATING : ""
```

## Entities

| Entity | Key fields | Defined in |
|---|---|---|
| User (base) | `uniqueId` (Connect Code), `name`, `surname`, `email`, `phone`, `role` | :68. Wire schema is `authUserSchema` in `src/schemas/authSchemas.ts`, which adds optional `organizationId`, `branchId`, `connectionStatus`, `directorActivationStatus`, `requestedBranchId`. |
| Director (`OrgOwner`) | `organizationId`, `directorActivationStatus` | :78 |
| Manager / Administrator | `connectionStatus`, `organizationId?`, `branchId?`, `requestedBranchId?` | :83 / :90 |
| Teacher | as above plus `classCategory`, `activationStatus` (`pending\|active\|suspended`) | :97 |
| Student | as above plus `classIds[]`, `statistics{quizAvg, homeworkCompletion, attendancePct}` | :106 |
| Parent | `connectionStatus`, `requestedBranchId`, `childIds[]`. No org of their own: org access comes through linked children. Backend stores links in `parent_children` (`parentId`, `studentId`, `linkedBy`). Branch staff link a parent by the parent's ID; the parent cannot link themselves. `connected` while at least one child is linked. | :115 |
| Organization | `id`, `name`, `email`, `phone`, `ownerId`, `logoUrl`, `activationStatus`, `joinCode`, `createdAt`, `lightTheme`, `darkTheme` | :124, `src/schemas/orgSchemas.ts` |
| Branch | `id` (Connect Code), `organizationId`, `name`, `createdAt` | :138, `src/schemas/branchSchemas.ts` |
| Class | `id`, `organizationId`, `branchId`, `name`, `teacherId\|null`, `studentIds[]`, `classPrice`, `joinCode`, `createdAt` | :145. Mock + backend (teacher classroom, see `planning/BACKEND_PLAN.md`). |
| Module / Lesson | Module: `teacherId`, `title`, `classId\|null`, `lessons[]`. Lesson: `id`, `moduleId`, `title`, `order`. **No content or AI fields.** | :164 / :157. Mock + backend. |
| Task / HomeworkSubmission | see `docs/apiContract.md` → Teacher classroom. One submission per student per lesson (photos + comment). | `src/schemas/teacherClassSchemas.ts`. Mock + backend. |
| Payment / Attendance / Rating | see `docs/apiContract.md:235-274` | :173 / :187 / :197. Mock only. |
| Statistics | `StatisticsSnapshot` (`src/types/statistics.ts`, `src/schemas/statisticsSchemas.ts`), aggregated on the client by `src/utils/aggregateBranchStatistics.ts`. `BranchOverview` (`src/schemas/managerHomeSchemas.ts`). | |
| Theme / branding | `ThemeColors` has 21 CSS vars (`src/types/theme.ts`). `OrganizationBranding` snapshot is in `src/types/org.ts`. | |

**Connect Code** (`src/utils/connectCode.ts`, `src/schemas/connectCodeSchemas.ts`): `/^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/`, produced by a seeded deterministic generator. It is used for user `uniqueId`, branch `id`, org `joinCode`, and class `joinCode`.

## Roles

All three sources list the same seven roles: `roleSchema` (`src/schemas/authSchemas.ts`), :61, and `src/routes/roles.ts`.

`edunify_admin`, `director`, `manager`, `administrator`, `teacher`, `student`, `parent`

- `edunify_admin` cannot sign up (`hasSignup()` in `src/routes/roles.ts`).
- Some comments and error strings in `fakeBackend.ts` (:1025-1031) and `apiContract.md` still use the old name `org_owner` for `director`.

## Activation and approval

- `isActivated` (:984):
  - A director needs `directorActivationStatus === 'activated'`. This is **not** the org's `activationStatus`.
  - A teacher needs `activationStatus === 'active'`.
  - Otherwise login returns 403 (:1077).
- **Self-signup bypasses approval.**
  - Signup (:1163) creates a director with an `active` org and an `activated` status.
  - A self-signed-up teacher is `active` immediately (:1205).
- Only `createOrg` (:1232, not wired to the UI) creates a `pending` org. A staff-created teacher is `pending` (:1677).
- `approveOrg` (:1259) and `approveTeacher` (:1347) are edunify_admin-only and **mock-only**. No UI calls them.

## Connection (joining an org)

1. When a manager, administrator, teacher, student, or parent signs up, they get `connectionStatus: 'unconnected'` (:1188-1221).
2. `src/components/connection/OrganizationConnectionPage.tsx`: the user enters a **branch ID**. It is uppercased and validated by `connectionRequestInputSchema` (`src/schemas/connectionSchemas.ts`).
3. `submitConnectionRequest` (:1134) only saves `requestedBranchId`. The user stays unconnected.
4. Linking is done by hand:
   - A director assigns a manager with `assignBranchManager` (:1392).
   - A director or branch staff assign administrators and teachers with `assignBranchAdministrator` / `assignBranchTeacher` (:1437 / :1456). This sets `connected`.
5. When the user is `unconnected`, `authStore` sets `organizationId` and `branchId` to null.

Only the **manager and administrator** homes use `RoleHomeWithConnection`. Teacher, student, and parent users have **no way in the UI** to connect, although the mock allows it (`CONNECTABLE_ROLES`, :271). The org `joinCode` is generated but never used.

## Permissions (as enforced by the mock, :991-1067)

| Guard | Who | Actions |
|---|---|---|
| OrgOwner | director (of that org), edunify_admin | org theme and logo; create, rename, or delete a branch; assign or remove a manager; create a manager or administrator |
| BranchStaff | director, or a manager/administrator of that branch | assign or remove an administrator or teacher; create a teacher, class, or student; assign a teacher to a class; add a payment |
| TeacherSelf | the teacher | module CRUD; connect or disconnect a module to a class |
| ClassTeacher | the assigned teacher | record attendance and ratings |
| Student self | student | `joinClassByCode` (:1815) |
| OrgAccess | org members; parents through their children | all list and get reads |
| edunify_admin | platform | `approveOrg`, `approveTeacher`, platform lists, `dump` |

In the UI, the only role gating is `Shared*` dispatch (`src/routes/Shared*.tsx`) and a director-only check in `src/pages/profile/AppearancePage.tsx:35`.

## Implemented user flows (UI)

| Role | Real | Stub |
|---|---|---|
| All | landing and login/signup modal (`components/auth`), profile edit, change password, language and theme toggle | |
| Director | home stats (`components/home/HomeOverview`), `/management` (branches CRUD and managers: `pages/director/ManagementPage.tsx`, `components/management/*`), `/appearance` org theme and logo | |
| Manager | `ManagerHome` overview, `/management` (administrators and teachers of the branch), `/payments`, `/classes`, `/students` (shared `Branch*View` components, branch from the profile) | |
| Administrator | the same pages as the manager (routes map `administrator` to the manager pages). Cannot remove themselves from the branch | connection request while unconnected |
| Director | home statistics, `/management` (branches, managers), `/payments`, `/classes`, `/students` with a branch picker (`?branch=`) | |
| Teacher | classes → lesson sidebar with Lessons / Tasks / Homeworks tabs, students by ID, attendance register | |
| Student | classes, tasks, homework photos with a comment | |
| Parent | home: own ID (to give to the school) and children list, polled while empty; `/children/:studentId`: read-only classes, 30-day attendance, homework (missed / upcoming / handed in), unpaid months and recent payments | |
| Branch staff | "Parents" section in the student card: link by parent ID with a name lookup, unlink | |
| Edunify admin | | `*HomePage` stub |

## Not implemented (no service or hook)

These exist only in the mock, or nowhere:

- classes and student CRUD
- assigning a teacher to a class
- modules, Lab, and lessons
- **AI lesson generation** (absent even from the mock)
- attendance and ratings
- payments UI
- student joining a class
- platform admin approvals
