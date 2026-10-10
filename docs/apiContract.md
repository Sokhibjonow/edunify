# Edunify API Contract

**Version:** MVP (frontend contract)  
**Maintained by:** Frontend team  
**Backend target:** Node.js + Express + Sequelize + PostgreSQL

This document is the source of truth for API shape. Mock (`VITE_USE_MOCKS=true`) and real backends must return identical contracts. Types live in `src/types`, validation in `src/schemas`, mock in `src/services/mocks/fakeBackend.ts`, services in `src/services`.

---

## Conventions

### Base URL

Configured via `VITE_API_URL`. All paths below are relative to this base.

### Response envelope

Every endpoint returns:

**Success**

```json
{ "ok": true, "data": "<T>" }
```

**Failure**

```json
{ "ok": false, "error": "<message>", "status": <httpStatus> }
```

The Axios response interceptor normalizes real HTTP errors into this envelope. Service functions unwrap via `ApiError` on `ok: false`.

### Authentication

- Login/signup return `Authorization: Bearer <jwt>` payload in `data.token`.
- Protected requests send `Authorization: Bearer <token>`.
- JWT format: `header.payload.signature` (HS256-shaped).
- Missing, invalid, or expired token → `401`.
- Insufficient role/tenancy → `403`.
- Missing resource → `404`.
- Validation conflict → `400` or `409`.

### Pagination

Paginated list endpoints return:

```ts
{
  items: T[]
  page: number      // 1-based
  pageSize: number  // default 20
  total: number
}
```

Query params: `page`, `pageSize`.

### Tenancy

- Hierarchy: **Organization → Branch → Class**.
- `director`, `manager`, `administrator`, `teacher` belong to exactly one org; branch staff to one branch.
- `student` context is derived from `classIds` (may span classes; not org-scoped in JWT).
- `parent` context is derived from linked students (`childIds`).
- `edunify_admin` is platform-scoped (not org-gated).

### Connect Code

- User `uniqueId` and branch `id` use format `XXX-XXX-XXX` (uppercase A–Z + digits).
- Validated by `connectCodeSchema`.

### Mock development

- Toggle: `VITE_USE_MOCKS=true` in env.
- Dataset generated **once** at module load via `faker.seed(20260316)`.
- CRUD mutates in-memory store for the session.
- Simulated latency: ~80ms per request.

**Pinned demo credentials (mock — Organization 1, `bfa.uz`)**

| Role | Email | Password |
|------|-------|----------|
| edunify_admin | admin@edunify.uz | Pass1234! |
| director | komiljon@bfa.uz | Pass1234! |
| manager (branch 1) | manager@bfa.uz | Pass1234! |
| administrator (branch 1) | administrator@bfa.uz | Pass1234! |
| manager (branch 2) | manager2@bfa.uz | Pass1234! |
| teacher (branch 1, English) | teacher@bfa.uz | Pass1234! |
| teacher (branch 1, Math) | teacher2@bfa.uz | Pass1234! |
| teacher (branch 2) | teacher3@bfa.uz | Pass1234! |
| student (primary) | student@bfa.uz | Pass1234! |
| student | student2@bfa.uz | Pass1234! |
| student | student3@bfa.uz | Pass1234! |
| parent | parent@bfa.uz | Pass1234! |

Organization 2 (`iec.uz`) seeded users keep Faker-generated emails; password is still `Pass1234!`.

---

## Entities

### User (base)

Shared identity fields for all roles.

| Field | Type | Required | Nullable | Notes |
|-------|------|----------|----------|-------|
| uniqueId | string | yes | no | Connect Code `XXX-XXX-XXX` |
| name | string | yes | no | |
| surname | string | yes | no | |
| email | string | yes | no | Globally unique; login credential |
| phone | string | yes | no | Contact only |
| role | Role | yes | no | See roles enum |

**Relationships:** role-specific extensions below. Password is never returned in API responses.

### Role enum

`edunify_admin` | `director` | `manager` | `administrator` | `teacher` | `student` | `parent`

### Director

Extends User.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| role | `"director"` | yes | |
| organizationId | string | yes | Exactly one org |

Gated by org `activationStatus === 'active'`.

### Manager

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| role | `"manager"` | yes | |
| organizationId | string | yes | |
| branchId | string | yes | Connect Code branch id |

### Administrator

Same shape as Manager with `role: "administrator"`.

### Teacher

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| role | `"teacher"` | yes | |
| organizationId | string | yes | |
| branchId | string | yes | |
| classCategory | string | yes | e.g. `"English"` |
| activationStatus | ActivationStatus | yes | `pending` \| `active` \| `suspended` |

Gated by own `activationStatus === 'active'`.

### Student

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| role | `"student"` | yes | |
| organizationId | string | yes | Derived from enrolled classes |
| branchId | string | yes | Primary branch attachment |
| classIds | string[] | yes | One or more class ids |
| statistics | object | yes | `{ quizAvg, homeworkCompletion, attendancePct }` numbers |

### Parent

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| role | `"parent"` | yes | |
| childIds | string[] | yes | Student `uniqueId` values |

Read-only access to children's data. A parent is linked to a child by branch staff (see "Parents"), never by themselves. Linking makes the parent `connected`; removing the last link makes them `unconnected` again.

### Organization

| Field | Type | Required | Nullable | Notes |
|-------|------|----------|----------|-------|
| id | string | yes | no | Internal id |
| name | string | yes | no | |
| email | string | yes | no | Org contact |
| phone | string | yes | no | |
| ownerId | string | yes | no | Director `uniqueId` |
| logoUrl | string | no | yes | |
| activationStatus | ActivationStatus | yes | no | |
| joinCode | string | yes | no | Connect Code |
| createdAt | string | yes | no | ISO 8601 |
| lightTheme | ThemeColors | yes | no | CSS variable hex map |
| darkTheme | ThemeColors | yes | no | CSS variable hex map |

### Branch

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Connect Code (globally unique) |
| organizationId | string | yes | |
| name | string | yes | |
| createdAt | string | yes | ISO 8601 |

### Class

| Field | Type | Required | Nullable | Notes |
|-------|------|----------|----------|-------|
| id | string | yes | no | Internal id |
| organizationId | string | yes | no | |
| branchId | string | yes | no | |
| name | string | yes | no | |
| teacherId | string | no | yes | Assigned teacher `uniqueId`; max one |
| studentIds | string[] | yes | no | Student `uniqueId` list |
| classPrice | number | yes | no | Monthly fee (raw number, UZS) |
| joinCode | string | yes | no | Connect Code for student join |
| createdAt | string | yes | no | ISO 8601 |

### Module

| Field | Type | Required | Nullable | Notes |
|-------|------|----------|----------|-------|
| id | string | yes | no | |
| teacherId | string | yes | no | Owner teacher |
| title | string | yes | no | |
| classId | string | no | yes | `null` = Lab-only |
| lessons | Lesson[] | yes | no | Embedded lesson list |
| createdAt | string | yes | no | ISO 8601 |

### Lesson

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | |
| moduleId | string | yes | |
| title | string | yes | |
| order | number | yes | 1-based sequence |

### Attendance

| Field | Type | Required | Nullable | Notes |
|-------|------|----------|----------|-------|
| id | string | yes | no | |
| classId | string | yes | no | |
| lessonId | string | yes | no | |
| studentId | string | yes | no | |
| status | AttendanceStatus | yes | no | `present` \| `absent` \| `late` \| `excused` |
| recordedBy | string | no | yes | Teacher `uniqueId` |
| recordedAt | string | yes | no | ISO 8601 |

### Rating

| Field | Type | Required | Nullable | Notes |
|-------|------|----------|----------|-------|
| id | string | yes | no | |
| classId | string | yes | no | |
| lessonId | string | yes | no | |
| studentId | string | yes | no | |
| score | number | yes | no | Typically 1–5 |
| comment | string | yes | no | |
| ratedBy | string | no | yes | Teacher `uniqueId` |
| ratedAt | string | yes | no | ISO 8601 |

### Payment

Money **received** from a student for one class and one billing month. Charges are not stored. Every student of a class with `classPrice > 0` owes `classPrice` each month they are enrolled, due on day `BILLING_DUE_DAY` (default 10). Several payments for the same class/student/month add up (partial payments). Status is derived; see `BillingLine`.

| Field | Type | Required | Nullable | Notes |
|-------|------|----------|----------|-------|
| id | string | yes | no | |
| classId | string | yes | no | |
| studentId | string | yes | no | |
| amount | number | yes | no | Whole sum, > 0 |
| currency | string | yes | no | `"UZS"` |
| period | string | yes | no | `YYYY-MM` billing month the money is for |
| paidAt | string | yes | no | ISO 8601, not in the future |
| note | string | yes | no | e.g. cash / card |
| recordedBy | string | no | yes | `uniqueId` of the staff member who accepted it |
| recordedAt | string | yes | no | ISO 8601 |

### BillingLine (one student × one priced class × one month)

| Field | Type | Notes |
|---|---|---|
| classId, className | string | |
| studentId, studentName | string | |
| charge | number | `classPrice` |
| paid | number | Sum of payments for the month |
| balance | number | `max(0, charge − paid)` |
| dueDate | string | `YYYY-MM-DD` |
| status | `paid` \| `partial` \| `due` \| `overdue` | `paid` when `paid ≥ charge`. `overdue` when unpaid after `dueDate`. `partial` when something is paid and the due date has not passed. Otherwise `due` |
| lastPaidAt | string \| null | |
| payments | `{ id, amount, paidAt, note, recordedBy }[]` | Oldest first |

The same lines drive the payments page, `BranchOverview.duePayments` (every unpaid month since enrollment) and `StatisticsSnapshot.paymentCounts` (fully paid lines / all lines of the month).

### StatisticsSnapshot (branch response DTO)

Returned per branch. Overall dashboard aggregates branch snapshots client-side — **no org-level statistics endpoint**.

| Field | Type | Notes |
|-------|------|-------|
| students | CountMetric | `{ count, delta }` |
| classes | CountMetric | |
| teachers | CountMetric | |
| averageAttendance | number | Percentage 0–100 |
| attendanceToday | number | Percentage 0–100 |
| averageAttendanceCounts | AttendanceCounts | `{ present, total }` for aggregation |
| attendanceTodayCounts | AttendanceCounts | |
| paymentCounts | PaymentCounts | `{ paid, total }` — students who paid vs total students for `to` month |
| revenue | number | Raw paid revenue for `to` month |
| expectedRevenue | ExpectedRevenueMetric | `{ amount, changePct }` |

`delta` / `changePct` are `null` for single-month period selections.

### BranchOverview (manager/administrator home response DTO)

Schema: `branchOverviewSchema`.

| Field | Type | Notes |
|-------|------|-------|
| attendanceTodayPct | number | Percentage 0–100, same basis as `StatisticsSnapshot.attendanceToday` |
| pendingTeachers | PendingAttendanceTeacher[] | `{ teacherId, name, surname, classCategory, pendingClassCount }` |
| duePayments | DuePaymentStudent[] | `{ studentId, name, surname, status: 'due' \| 'overdue', dueDate: string \| null }` (`dueDate` = ISO date the payment was due) |

Empty arrays are valid (no pending teachers / no due payments).

---

## Request / Response DTOs

### AuthUser (response)

Subset returned in session and `/auth/me`. Schema: `authUserSchema`.

```ts
{
  uniqueId: string
  name: string
  surname: string
  email: string
  phone: string
  role: Role
  organizationId?: string       // present when connected (org-scoped roles)
  branchId?: string             // present when connected (branch-scoped roles)
  connectionStatus?: 'connected' | 'unconnected'  // manager, administrator, teacher, student, parent
  directorActivationStatus?: 'activated' | 'not_activated'  // director only
  requestedBranchId?: string | null  // pending branch connection request; not a tenancy assignment
}
```

**Connection rules**

- `connectionStatus` is explicit — do not infer from null `organizationId` / `branchId`.
- Self-signup for manager, administrator, teacher, student, and parent creates `connectionStatus: 'unconnected'`.
- Seeded demo users and director-provisioned staff remain `connected`.
- `requestedBranchId` stores a submitted branch ID while the user stays `unconnected`; the director manually links the user via management (e.g. assign branch manager by User ID).
- Directors use `directorActivationStatus` (`activated` | `not_activated`); login is blocked when `not_activated`.

### ConnectionStatusResponse (response)

Schema: `connectionStatusResponseSchema`.

```ts
{
  connectionStatus: 'connected' | 'unconnected'
  requestedBranchId: string | null
  organizationId?: string
  branchId?: string
  directorActivationStatus?: 'activated' | 'not_activated'
}
```

### ConnectionRequestInput (request)

Schema: `connectionRequestInputSchema`. Branch ID must match Connect Code format `XXX-XXX-XXX`.

```ts
{ branchId: string }
```

### Profile (response)

Returned by `GET /profile` and `PATCH /profile`. Schema: `profileSchema`.

```ts
{
  uniqueId: string
  name: string
  surname: string
  email: string
  phone: string
  organizationName: string | null
}
```

### ProfilePatchInput (request)

```ts
{
  name: string       // trimmed, min 1
  surname: string    // trimmed, min 1
  email: string      // valid email format; globally unique
  phone: string      // international format, e.g. +998901234567
}
```

**Errors:** `409` if email is already registered by another user.

### ChangePasswordInput (request)

```ts
{ currentPassword: string; newPassword: string }
```

### ChangePasswordResult (response)

```ts
{ success: true }
```

### AuthSession (response)

```ts
{ token: string; user: AuthUser }
```

### LoginInput (request)

```ts
{ email: string; password: string }
```

### SignupInput (request)

```ts
{
  role: SignupRole  // all except edunify_admin
  name: string
  surname: string
  phone: string
  email: string
  password: string
  organizationName?: string  // required when role === 'director'
}
```

### CreateBranchInput (request)

```ts
{ name: string }
```

### UpdateBranchInput (request)

Same as CreateBranchInput.

### AssignBranchManagerInput (request)

```ts
{ name: string; managerId: string }  // managerId = Connect Code uniqueId
```

### OrgThemePatchInput (request)

```ts
{ lightTheme?: ThemeColors; darkTheme?: ThemeColors }
```

### OrgThemePatchResult (response)

```ts
{ lightTheme: ThemeColors; darkTheme: ThemeColors }
```

### OrgLogoPatchResult (response)

```ts
{ logoUrl: string }
```

### StatisticsPeriod (query)

```ts
{ from: string; to: string }  // YYYY-MM, from <= to
```

### BranchStudentCounts (response)

```ts
Record<branchId, number>  // student count per branch
```

### BranchManager / BranchAdministrator / BranchTeacher (list item response)

```ts
{ uniqueId: string; name: string; surname: string }
```

### AssignBranchAdministratorInput / AssignBranchTeacherInput (request)

```ts
{ administratorId: string }  // assign administrator by uniqueId
{ teacherId: string }        // assign teacher by uniqueId
```

---

## Endpoints (frontend-used)

### POST `/auth/login`

**Description:** Authenticate by email + password.  
**Auth:** Public  
**Request body:** `LoginInput`  
**Response:** `AuthSession`  
**Errors:** `401` invalid credentials; `403` account not activated  

**Example request**

```json
{ "email": "komiljon@bfa.uz", "password": "Pass1234!" }
```

**Example response**

```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "uniqueId": "ABC-123-DEF",
      "name": "Komiljon",
      "surname": "Abdullayev",
      "email": "komiljon@bfa.uz",
      "phone": "+998901000001",
      "role": "director",
      "organizationId": "0001"
    }
  }
}
```

---

### GET `/auth/me`

**Description:** Return the authenticated user.  
**Auth:** Bearer JWT  
**Response:** `AuthUser`  
**Errors:** `401`  

---

### GET `/profile`

**Description:** Return the authenticated user's profile including resolved organization name.  
**Auth:** Bearer JWT  
**Response:** `Profile`  
**Errors:** `401`  

Org-scoped roles (`director`, `manager`, `administrator`, `teacher`) resolve `organizationName` from the user's organization. `student` and `parent` resolve it from connected class/student context. `edunify_admin` receives `organizationName: null`.

---

### PATCH `/profile`

**Description:** Update the authenticated user's name and surname.  
**Auth:** Bearer JWT  
**Request body:** `ProfilePatchInput` (`name`, `surname`, `email`, `phone`)  
**Response:** `Profile`  
**Errors:** `400` validation; `401`; `409` email taken  

`uniqueId` and `organizationName` are read-only.

---

### PATCH `/profile/password`

**Description:** Change the authenticated user's password.  
**Auth:** Bearer JWT  
**Request body:** `ChangePasswordInput` (`currentPassword`, `newPassword`)  
**Response:** `ChangePasswordResult` (`{ success: true }`)  
**Errors:** `400` incorrect current password or validation; `401`  

---

### GET `/connection/status`

**Description:** Return the authenticated user's organization connection state.  
**Auth:** Bearer JWT  
**Response:** `ConnectionStatusResponse`  
**Errors:** `401`  

Used on load to detect when a director has manually linked the user (via `/auth/me` refresh as well).

---

### POST `/connection/request`

**Description:** Submit a branch connection request. Validates that the branch exists, stores `requestedBranchId`, and keeps `connectionStatus: 'unconnected'`. Does **not** assign the user to the branch.  
**Auth:** Bearer JWT — `manager`, `administrator`, `teacher`, `student`, or `parent`  
**Request body:** `ConnectionRequestInput`  
**Response:** `ConnectionStatusResponse`  
**Errors:** `400` already connected; `401`; `403` role not allowed; `404` branch not found  

**Tenancy:** Manual linking is performed by the director — assign the user's `uniqueId` to a branch via management (managers: `POST /orgs/:orgId/branches/:branchId/managers`; administrators: same pattern via `assignBranchAdministrator` in mock, pending management UI).

**Frontend:** Unconnected `manager` and `administrator` roles share the same organization connection page and modal (`OrganizationConnectionPage` / `RoleHomeWithConnection`).

---

### POST `/auth/signup`

**Description:** Self-service registration. Creates account and returns session (auto-login).  
**Auth:** Public  
**Request body:** `SignupInput` (+ `organizationName` for director)  
**Response:** `AuthSession`  
**Errors:** `400` validation; `409` email taken  

---

### GET `/auth/active-organization`

**Description:** Resolve the active organization for the current user (used when `organizationId` is absent on user, e.g. parent).  
**Auth:** Bearer JWT  
**Response:** `Organization | null`  
**Errors:** `401`  

---

### GET `/orgs/:orgId`

**Description:** Get organization by id including branding themes.  
**Auth:** Bearer JWT — `edunify_admin` or org member (incl. parent with child in org)  
**Path params:** `orgId`  
**Response:** `Organization`  
**Errors:** `401`, `403`, `404`  

---

### PATCH `/orgs/:orgId/theme`

**Description:** Update org light/dark theme palettes.  
**Auth:** Bearer JWT — `director` of org or `edunify_admin`  
**Request body:** `OrgThemePatchInput`  
**Response:** `OrgThemePatchResult`  
**Errors:** `401`, `403`, `404`  

---

### PATCH `/orgs/:orgId/logo`

**Description:** Upload organization logo (`multipart/form-data`, field `logo`).  
**Auth:** Bearer JWT — `director` of org or `edunify_admin`  
**Response:** `OrgLogoPatchResult`  
**Errors:** `401`, `403`, `404`  

---

### GET `/orgs/:orgId/branches`

**Description:** List branches for an organization.  
**Auth:** Bearer JWT — org access  
**Query:** `page`, `pageSize`  
**Response:** `Page<Branch>`  
**Errors:** `401`, `403`, `404`  

**Example response**

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "KLM-456-PQR",
        "organizationId": "0001",
        "name": "Chilonzor Branch",
        "createdAt": "2025-03-10T08:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 2
  }
}
```

---

### GET `/orgs/:orgId/branches/student-counts`

**Description:** Map of branch id → student count (for home overview filtering).  
**Auth:** Bearer JWT — org access  
**Response:** `BranchStudentCounts`  
**Errors:** `401`, `403`, `404`  

**Example response**

```json
{
  "ok": true,
  "data": {
    "KLM-456-PQR": 4,
    "STU-789-VWX": 1
  }
}
```

---

### GET `/orgs/:orgId/branches/:branchId/managers`

**Description:** List managers assigned to a branch.  
**Auth:** Bearer JWT — org access  
**Query:** `page`, `pageSize`  
**Response:** `Page<BranchManager>`  
**Errors:** `401`, `403`, `404`  

---

### POST `/orgs/:orgId/branches`

**Description:** Create a branch.  
**Auth:** Bearer JWT — `director` of org  
**Request body:** `CreateBranchInput`  
**Response:** `Branch`  
**Errors:** `400`, `401`, `403`, `404`  

---

### PATCH `/orgs/:orgId/branches/:branchId`

**Description:** Update branch name.  
**Auth:** Bearer JWT — `director` of org  
**Request body:** `UpdateBranchInput`  
**Response:** `Branch`  
**Errors:** `400`, `401`, `403`, `404`  

---

### DELETE `/orgs/:orgId/branches/:branchId`

**Description:** Delete a branch. Its managers, administrators and teachers become `unconnected`.  
**Auth:** Bearer JWT — `director` of org  
**Response:** `null`  
**Errors:** `401`, `403`, `404`, `409` the branch still has classes (move or delete them first)  

---

### POST `/orgs/:orgId/branches/:branchId/managers`

**Description:** Assign an existing org manager to a branch (validates display name match).  
**Auth:** Bearer JWT — `director` of org  
**Request body:** `AssignBranchManagerInput`  
**Response:** `BranchManager`  
**Errors:** `400` name mismatch; `401`; `403`; `404`  

---

### DELETE `/orgs/:orgId/branches/:branchId/managers/:managerId`

**Description:** Remove manager from branch (unassign).  
**Auth:** Bearer JWT — `director` of org  
**Path params:** `managerId` = manager `uniqueId`  
**Response:** `null`  
**Errors:** `401`, `403`, `404`  

---

### GET `/orgs/:orgId/branches/:branchId/administrators`

**Description:** List administrators assigned to a branch.  
**Auth:** Bearer JWT — org access  
**Query:** `page`, `pageSize`  
**Response:** `Page<BranchAdministrator>`  
**Errors:** `401`, `403`, `404`  

---

### GET `/orgs/:orgId/branches/:branchId/teachers`

**Description:** List teachers assigned to a branch.  
**Auth:** Bearer JWT — org access  
**Query:** `page`, `pageSize`  
**Response:** `Page<BranchTeacher>`  
**Errors:** `401`, `403`, `404`  

---

### POST `/orgs/:orgId/branches/:branchId/administrators`

**Description:** Link an existing administrator to a branch by `uniqueId` (no name match).  
**Auth:** Bearer JWT — branch staff (`director` of org, or `manager`/`administrator` of that branch)  
**Request body:** `AssignBranchAdministratorInput` (`{ administratorId }`)  
**Response:** `BranchAdministrator`  
**Errors:** `401`; `403`; `404` administrator/branch not found  

---

### POST `/orgs/:orgId/branches/:branchId/teachers`

**Description:** Link an existing teacher to a branch by `uniqueId` (no name match). Activation status is unchanged.  
**Auth:** Bearer JWT — branch staff (`director` of org, or `manager`/`administrator` of that branch)  
**Request body:** `AssignBranchTeacherInput` (`{ teacherId }`)  
**Response:** `BranchTeacher`  
**Errors:** `401`; `403`; `404` teacher/branch not found  

---

### DELETE `/orgs/:orgId/branches/:branchId/administrators/:administratorId`

**Description:** Remove an administrator from the branch (unassign → unconnected).  
**Auth:** Bearer JWT — branch staff  
**Path params:** `administratorId` = administrator `uniqueId`  
**Response:** `null`  
**Errors:** `400` an administrator cannot remove themselves, `401`, `403`, `404`  

---

### DELETE `/orgs/:orgId/branches/:branchId/teachers/:teacherId`

**Description:** Remove a teacher from the branch (unassign → unconnected). **Cascade:** the teacher is unassigned from their classes in this branch (`teacherId → null`) and any of their modules connected to those classes are auto-disconnected (returned to Lab-only). Modules are never deleted.  
**Auth:** Bearer JWT — branch staff  
**Path params:** `teacherId` = teacher `uniqueId`  
**Response:** `null`  
**Errors:** `401`, `403`, `404`  

---

### GET `/orgs/:orgId/branches/:branchId/statistics`

**Description:** Branch statistics for a month range. Overall statistics are computed by the frontend via `aggregateBranchStatistics()` over all branch responses — **not a separate API endpoint**.  
**Auth:** Bearer JWT — `director` of org, or `manager`/`administrator` of this branch (revenue is not visible to teachers, students or parents)  
**Query:** `from` (YYYY-MM), `to` (YYYY-MM)  
**Response:** `StatisticsSnapshot`  
**Errors:** `400` invalid period; `401`; `403`; `404`  

**Tenancy:** Statistics scoped to classes/users in the branch.

**Data sources (backend):**

- Students = distinct students enrolled in the branch's classes by the end of the month. Enrollment date is `class_students.createdAt`.
- Classes and teachers are counted by `createdAt`, so the history is approximate: removals are not tracked yet.
- Attendance comes from the `attendance` table.
- Revenue and the paid count come from `payments` with `status = paid` and `period = to`.
- Expected revenue = Σ `classPrice` × students enrolled in the class by the end of the month.
- Nothing is synthesized. An empty branch returns zeros. (The mock still fills missing history with generated values.)

**Comparison rules (period badges):**

- Single month (`from === to`): count deltas and expected-revenue `changePct` are `null`.
- Multi-month: compare average of all months before `to` vs `to` month.

**Example request**

```
GET /orgs/0001/branches/KLM-456-PQR/statistics?from=2026-04&to=2026-06
```

**Example response**

```json
{
  "ok": true,
  "data": {
    "students": { "count": 4, "delta": 2 },
    "classes": { "count": 2, "delta": 0 },
    "teachers": { "count": 2, "delta": 1 },
    "averageAttendance": 85,
    "attendanceToday": 90,
    "averageAttendanceCounts": { "present": 17, "total": 20 },
    "attendanceTodayCounts": { "present": 9, "total": 10 },
    "paymentCounts": { "paid": 7, "total": 9 },
    "revenue": 1330000,
    "expectedRevenue": { "amount": 2200000, "changePct": 5 }
  }
}
```

### GET `/orgs/:orgId/branches/:branchId/overview`

**Description:** Operational snapshot for the manager/administrator branch home dashboard: today's attendance percentage, teachers with classes still missing today's attendance, and students with due/overdue payments.  
**Auth:** Bearer JWT — `director` of org, or `manager`/`administrator` of this branch  
**Response:** `BranchOverview` (a `due` payment whose `dueDate` has passed is reported as `overdue`)  
**Errors:** `401`; `403`; `404` branch not found  

**Tenancy:** Pending teachers and due payments are scoped to classes in the given branch.

**Definitions:**

- `pendingTeachers`: one entry per teacher assigned to ≥1 branch class that has **no attendance recorded today**; `pendingClassCount` is how many of their classes are pending.
- `duePayments`: one entry per student in the branch with at least one payment whose status is `due` or `overdue` (`overdue` takes precedence when both exist).

**Example request**

```
GET /orgs/0001/branches/KLM-456-PQR/overview
```

**Example response**

```json
{
  "ok": true,
  "data": {
    "attendanceTodayPct": 78,
    "pendingTeachers": [
      { "teacherId": "ABC-123-DEF", "name": "Dilnoza", "surname": "Karimova", "classCategory": "History", "pendingClassCount": 1 }
    ],
    "duePayments": [
      { "studentId": "GHI-456-JKL", "name": "Jasur", "surname": "Aliyev", "status": "overdue", "dueDate": "2026-06-10T00:00:00.000Z" }
    ]
  }
}
```

---

## Teacher classroom

Roadmap and status: [`planning/BACKEND_PLAN.md`](planning/BACKEND_PLAN.md). Schemas: `src/schemas/teacherClassSchemas.ts`. Service: `src/services/teacherClassService.ts`.

### Entities

**Task**

| Field | Type | Notes |
|---|---|---|
| id | string | UUID |
| classId | string | |
| lessonId | string \| null | Optional link to a lesson |
| title | string | |
| description | string | May be empty |
| dueDate | string \| null | ISO 8601 |
| priority | `normal` \| `important` | `important` = shown highlighted in the "Important tasks" tab |
| createdBy | string | Teacher `uniqueId` |
| createdAt | string | ISO 8601 |

**HomeworkSubmission**: one per student per lesson.

| Field | Type | Notes |
|---|---|---|
| id | string | UUID |
| classId | string | |
| lessonId | string | |
| studentId | string | Student `uniqueId` |
| studentName | string | `"Name Surname"`, joined server-side |
| comment | string | Student's comment, may be empty |
| photos | string[] | Absolute image URLs, 1–5 |
| submittedAt | string | ISO 8601 |
| status | `submitted` \| `reviewed` \| `late` | `late` when submitted after the due date of a task linked to the lesson |

**StudentSummary** (list item in class students)

```ts
{ uniqueId: string; name: string; surname: string; email: string; phone: string; role: 'student' }
```

**AttendanceRegister**: one register per class per calendar day. `date` is the day in the school's time zone (`APP_TIMEZONE`, default `Asia/Tashkent`); the frontend sends the browser's local date.

```ts
{
  date: string                 // YYYY-MM-DD
  lessonId: string | null      // lesson the register was taken for
  recordedAt: string | null    // null = not taken for this day yet
  records: { studentId: string; status: 'present' | 'late' | 'absent' | 'excused' }[]
}
```

Statistics count only `present` as attended. `late` and `excused` are in the total but not in `present`.

**StudentLookup**

```ts
{ uniqueId: string; name: string; surname: string; alreadyInClass: boolean }
```

**StudentCredentials**: returned once; the password is not retrievable later.

```ts
{ student: StudentSummary; login: string; password: string }  // login = email used on the login form
```

### Endpoints

| Method | Path | Guard | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/teachers/:teacherId/classes` | teacher self | `page`, `pageSize` | `Page<Class>` | 401, 403 |
| POST | `/teachers/:teacherId/classes` | teacher self, connected | `{ name }` | `Class` (teacher = caller, org/branch = teacher's) | 400 not connected / empty name, 401, 403 |
| GET | `/students/:studentId/classes` | student self | `page`, `pageSize` | `Page<Class>` (classes the student is enrolled in; the frontend polls every 15 s while the list is empty) | 401, 403 |
| GET | `/classes/:classId` | class member | | `Class` | 401, 403, 404 |
| GET | `/classes/:classId/modules` | class member | `page`, `pageSize` | `Page<Module>` (lessons embedded, sorted by `order`) | 401, 403, 404 |
| POST | `/classes/:classId/modules` | class teacher | `{ title }` | `Module` (connected to the class, `lessons: []`) | 400, 401, 403, 404 |
| POST | `/modules/:moduleId/lessons` | module owner | `{ title }` | `Lesson` (`order` = last + 1) | 400, 401, 403, 404 |
| GET | `/classes/:classId/attendance` | class teacher, or director / staff of the class branch | `date` (YYYY-MM-DD, default today) | `AttendanceRegister` (empty `records` and `recordedAt: null` when not taken) | 400 bad date, 401, 403, 404 |
| PUT | `/classes/:classId/attendance` | class teacher | `{ date, lessonId \| null, records: [{ studentId, status }] }` | `AttendanceRegister`. Replaces the whole register of that date | 400 future date / student not in class / duplicate student / lesson of another class, 401, 403, 404 |
| GET | `/classes/:classId/tasks` | class member | | `Task[]` (newest first) | 401, 403, 404 |
| POST | `/classes/:classId/tasks` | class teacher | `{ title, description, lessonId \| null, dueDate \| null, priority }` | `Task` | 400 (lesson not in class), 401, 403, 404 |
| GET | `/classes/:classId/homeworks` | class member | `lessonId` (required by the frontend) | `HomeworkSubmission[]` (newest first). A student sees only their own. | 401, 403, 404 |
| POST | `/classes/:classId/homeworks` | class student | `multipart/form-data`: `lessonId`, `comment`, `photos` (1–5 images, ≤ 5 MB each) | `HomeworkSubmission` (re-submit replaces the previous one and resets status) | 400, 401, 403, 404 |
| PATCH | `/homeworks/:homeworkId/review` | class teacher | | `HomeworkSubmission` with `status: 'reviewed'` | 401, 403, 404 |
| GET | `/classes/:classId/students` | class member | `page`, `pageSize` | `Page<StudentSummary>` | 401, 403, 404 |
| GET | `/classes/:classId/students/lookup` | class teacher | `uniqueId` | `StudentLookup` | 403 student of another org, 404 no such student |
| POST | `/classes/:classId/students/link` | class teacher | `{ uniqueId }` | `StudentSummary` (student becomes `connected` to the class org/branch) | 403 another org, 404, 409 already in class |
| POST | `/classes/:classId/students` | class teacher | `{ name, surname }` | `StudentCredentials`: login `name.surname@edunify.uz` (transliterated, numeric suffix if taken), random password | 400, 401, 403 |
| POST | `/classes/:classId/students/:studentId/reset-password` | class teacher | | `StudentCredentials` | 401, 403, 404 |
| DELETE | `/classes/:classId/students/:studentId` | class teacher, or director / staff of the class's branch | | `{ studentId, undone, lastBilledPeriod \| null }` | 401, 403, 404 not in the class |

**Removing a student** (`src/services/teacherClassService.ts` → `removeClassStudent`): the stay ends (`class_students.leftAt`); the student loses access to the class at once. Attendance, homework, payments and debts are kept, and the month of leaving is billed in full (`lastBilledPeriod`). Removing on the day the student was added, with no payment recorded since, undoes the enrollment (`undone: true`, nothing billed). A student who comes back gets a new stay, so the months in between are not billed.

**Example:** add an existing student by ID

```
POST /classes/6f1c…/students/link
{ "uniqueId": "K7M-2QX-9DP" }
```

```json
{ "ok": true, "data": { "uniqueId": "K7M-2QX-9DP", "name": "Nodira", "surname": "Ergasheva", "email": "nodira.ergasheva@edunify.uz", "phone": "+998901234567", "role": "student" } }
```

**Example:** homework list for one lesson

```
GET /classes/6f1c…/homeworks?lessonId=9a2e…
```

```json
{
  "ok": true,
  "data": [
    {
      "id": "c41d…", "classId": "6f1c…", "lessonId": "9a2e…",
      "studentId": "2QI-6EA-IQU", "studentName": "Aziza Karimova",
      "comment": "Page 2 is the vocabulary part.",
      "photos": ["http://localhost:3000/uploads/homeworks/c41d-1.jpg"],
      "submittedAt": "2026-10-02T17:10:00.000Z", "status": "submitted"
    }
  ]
}
```

---

## Branch classes (staff)

Director of the org, or manager/administrator of the branch. Service: `src/services/branchClassService.ts`. Schemas: `src/schemas/branchClassSchemas.ts`.

**BranchClass** = `Class` + `teacher: { uniqueId, name, surname } | null`, `currentPrice: number` (fee for the current month), `nextPrice: { price, effectiveFrom } | null` (scheduled change). `Class.classPrice` is the latest fee set, possibly not yet in effect.

**Fee history:** a fee applies from a billing month on (`class_prices`). Billing for month M uses the latest change effective on or before M, so a price change never creates debt for past months. A class without any fee (for example one created by a teacher) is not billed.

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/orgs/:orgId/branches/:branchId/classes` | `page`, `pageSize` | `Page<BranchClass>` | 401, 403, 404 |
| POST | `/orgs/:orgId/branches/:branchId/classes` | `{ name, classPrice (≥ 0), teacherId \| null }` | `BranchClass`. The fee applies from the current month | 400 teacher not connected to this branch / bad price, 401, 403, 404 |
| PATCH | `/orgs/:orgId/branches/:branchId/classes/:classId` | `{ name?, teacherId? (null = unassign), price?: { amount, effectiveFrom: YYYY-MM } }` | `BranchClass` | 400 fee change in a past month or more than 12 months ahead / teacher not in branch, 401, 403, 404 |
| DELETE | `/orgs/:orgId/branches/:branchId/classes/:classId` | | `null` | 409 the class has students, former students or payment history, 401, 403, 404 |

- **Changing the teacher:** the previous teacher's modules leave the class and return to their Lab (same rule as removing a teacher from the branch).
- **A new fee** removes any change scheduled for the same or a later month.

---

## Branch students (staff)

Director of the org, or manager/administrator of the branch. Service: `src/services/branchStudentService.ts`. Schemas: `src/schemas/branchStudentSchemas.ts`.

**BranchStudent** = `StudentSummary` plus:

| Field | Type | Notes |
|---|---|---|
| classes | `{ id, name }[]` | Classes of this branch the student is in now. Empty for a former student, who stays listed while they owe money |
| enrolledAt | string | Earliest enrollment in the branch |
| attendance | `{ present, late, absent, excused, total, pct \| null }` | Last 30 days (`APP_TIMEZONE`). `pct` = present / total; `null` when no register was taken |
| outstanding | number | Sum of unpaid balances, all months since enrollment (current month included) |
| overdue | number | Part of `outstanding` past its due date |
| unpaid | `{ classId, className, period, balance, dueDate, status: 'due' \| 'partial' \| 'overdue' }[]` | Oldest first. Same billing rules as `BillingLine` |

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/orgs/:orgId/branches/:branchId/students` | | `BranchStudent[]`, sorted by name. Not paginated: one row per student of the branch | 401, 403, 404 |
| GET | `/orgs/:orgId/branches/:branchId/students/lookup` | `uniqueId` | `{ uniqueId, name, surname, classIds }` (`classIds` = classes of this branch the student is already in) | 403 another organization, 404 no such student |
| POST | `/orgs/:orgId/branches/:branchId/students/enroll` | `{ uniqueId, classId }` | `StudentSummary`. Same rules as the teacher's `students/link`: the student becomes `connected` to the org/branch | 403 another org, 404 student / class not in branch, 409 already in class |

A student who was in a class on any day of a month owes that whole month (the month of joining and the month of leaving alike).

**Parents of a student** (same access). Service: `src/services/parentService.ts`. Schemas: `src/schemas/parentSchemas.ts`.

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/orgs/:orgId/branches/:branchId/students/:studentId/parents` | | `{ uniqueId, name, surname, phone, email }[]`, oldest link first | 401, 403, 404 student not in branch |
| GET | `/orgs/:orgId/branches/:branchId/parents/lookup` | `uniqueId` | `{ uniqueId, name, surname }` | 404 no parent with this ID |
| POST | `/orgs/:orgId/branches/:branchId/students/:studentId/parents` | `{ parentId }` | `201`, the linked parent | 403, 404 student not in branch / no such parent, 409 already linked |
| DELETE | `/orgs/:orgId/branches/:branchId/students/:studentId/parents/:parentId` | | `null` | 403, 404 not linked |

---

## Parents

Only the parent themselves (`role = parent`, `uniqueId = :parentId`), otherwise 403. A child that is not linked returns 404. The parent may also read `GET /orgs/:orgId` for an org where one of their children studies.

| Method | Path | Response |
|---|---|---|
| GET | `/parents/:parentId/children` | `{ uniqueId, name, surname, classes: { id, name, teacherName \| null }[] }[]`. Empty until staff link a child; the frontend polls every 15 s while empty |
| GET | `/parents/:parentId/children/:studentId` | `ChildOverview` |

**ChildOverview**

| Field | Shape | Notes |
|---|---|---|
| student | `{ uniqueId, name, surname }` | |
| classes | `{ id, name, teacherName \| null }[]` | |
| attendance | `{ present, late, absent, excused, total, pct \| null, recent: { date, className, status }[] }` | Last 30 days, same formula as `BranchStudent.attendance`; `recent` = last 10 marks |
| homework.upcoming | `ChildTask[]` | Tasks with no due date or due later, at most 10. `ChildTask = { taskId, title, description, dueDate \| null, priority, className, lessonTitle \| null, submitted }` |
| homework.missing | `ChildTask[]` | Task tied to a lesson, past due, with no submission for that lesson |
| homework.recent | `{ id, className, lessonTitle, status, submittedAt, photoCount, comment }[]` | Last 10 submissions |
| payments | `{ outstanding, overdue, unpaid: { className, period, balance, dueDate, status }[], recent: { id, className, period, amount, paidAt }[] }` | Same billing rules as `BillingLine`; `recent` = last 10 payments |

---

## Branch payments

Director of the org, or manager/administrator of the branch. Service: `src/services/paymentService.ts`. Schemas: `src/schemas/paymentSchemas.ts`.

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/orgs/:orgId/branches/:branchId/payments` | `month` (YYYY-MM, default current) | `{ month, dueDate, currency, summary: { expected, collected, outstanding, paidCount, overdueCount, totalCount }, items: BillingLine[] }`. Items sorted overdue → partial → due → paid, then by name | 400 bad month, 401, 403, 404 |
| POST | `/orgs/:orgId/branches/:branchId/payments` | `{ classId, studentId, period, amount, paidAt?, note }` | `Payment` | 400 student not in class / amount ≤ 0 / future `paidAt` / period more than 3 months ahead, 401, 403, 404 class not in branch |
| DELETE | `/orgs/:orgId/branches/:branchId/payments/:paymentId` | | `null`. Undoes a mistaken entry | 401, 403, 404 |

`collected` counts at most `charge` per line, so an overpayment does not inflate it. `outstanding` is the sum of balances.

---

## Client-side aggregation (not an API endpoint)

**Overall statistics** on the director home page:

1. Fetch all branches via `GET /orgs/:orgId/branches`.
2. Fetch each branch statistics via `GET /orgs/:orgId/branches/:branchId/statistics`.
3. Aggregate with `aggregateBranchStatistics(branches)` in `src/utils/aggregateBranchStatistics.ts`.

Rules: sum counts/revenue; weighted attendance from raw counts; recompute expected-revenue `changePct`.

---

## Schema reference map

| DTO | Zod schema | Type |
|-----|------------|------|
| AuthUser | `authUserSchema` | `src/types/auth` |
| Profile | `profileSchema` | `src/types/profile` |
| ProfilePatchInput | `profilePatchInputSchema` | `src/types/profile` |
| ConnectionStatusResponse | `connectionStatusResponseSchema` | `src/types/connection` |
| ConnectionRequestInput | `connectionRequestInputSchema` | `src/types/connection` |
| ChangePasswordInput | `changePasswordInputSchema` | `src/types/profile` |
| AuthSession | `authSessionSchema` | `src/types/auth` |
| LoginInput | `loginInputSchema` | `src/types/auth` |
| SignupInput | `signupInputSchema` | `src/types/auth` |
| Organization | `organizationSchema` | `src/types/org` |
| Branch | `branchSchema` | `src/types/branch` |
| BranchManager | `branchManagerSchema` | `src/types/branch` |
| BranchAdministrator | `branchAdministratorSchema` | `src/types/branch` |
| BranchTeacher | `branchTeacherSchema` | `src/types/branch` |
| AssignBranchAdministratorInput | `assignBranchAdministratorInputSchema` | `src/types/branch` |
| AssignBranchTeacherInput | `assignBranchTeacherInputSchema` | `src/types/branch` |
| StatisticsSnapshot | `statisticsSnapshotSchema` | `src/types/statistics` |
| BranchOverview | `branchOverviewSchema` | `src/types/managerHome` |
| Page | `pageSchema(item)` | inline |

---

## Mock implementation notes

- **Library:** `@faker-js/faker` (only imported in `fakeBackend.ts`).
- **Seed:** `faker.seed(20260316)` — deterministic across reloads.
- **Persistence:** In-memory `DB` object; mutations survive until page reload.
- **Validation:** Frontend-used mock responses pass through the same zod schemas as services before returning.
- **Switching to production:** Set `VITE_USE_MOCKS=false`. No changes to components, hooks, stores, query keys, routes, schemas, or types.

---

## Future endpoints (mock exists, not yet wired in services)

The mock backend also implements platform admin, Lab (modules without a class), attendance, ratings, and payment endpoints for upcoming features. When wired, each must be added here before the feature ships. The phase plan and backend status live in [`planning/BACKEND_PLAN.md`](planning/BACKEND_PLAN.md).
