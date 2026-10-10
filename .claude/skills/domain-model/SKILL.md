---
name: domain-model
description: Use when working on roles, tenancy, permissions, role pages, connecting users, activation/approval, Lab/modules, teacher assignment, or student/parent visibility.
---

# Domain Model

## Tenancy
Org → Branches → Classes (fixed). Branches hold staff (managers, administrators, teachers) and classes. A class has many students and at most one teacher (`teacherId | null`).

## Roles
| Role | Scope | Gated | Notes |
|---|---|---|---|
| `edunify_admin` | Platform | Never | Approves orgs and teachers |
| `director` | One org | Org `activationStatus` | Org owner, one per org, org-wide authority |
| `manager` | One branch, one org | No | |
| `administrator` | One branch, one org | No | |
| `teacher` | One branch, one org | Own `activationStatus` | Assignable to classes in their branch |
| `student` | Connected classes | No | NOT org/branch/teacher-scoped |
| `parent` | Linked students | No | Read-only |

No multi-org membership for staff. Students and parents are connection-scoped. Edunify Admin is the only platform role.

## authStore context
- director / manager / administrator / teacher: user + JWT + `organizationId` + `branchId` (director: `branchId` may be null — ASSUMED, confirm).
- edunify_admin / student / parent: user + JWT only; context derived from connected entities.

## Activation (gated UI)
Items marked ASSUMED were added beyond the original spec. Confirm or edit them.
- `pending` or `rejected` director or teacher → only `/pending` is reachable (Pending Activation screen: status, short explanation, logout).
- `rejected` shows a rejected message instead of "waiting". (ASSUMED)
- After approval the user must log in again to get the new status (no polling in the MVP). (ASSUMED)

## Identifiers & auth
- Permanent `uniqueId` per user, format `XXX-XXX-XXX` (A–Z, 0–9). Validate with `/^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/`.
- MVP joining by ID only, no join codes: student → class ID; parent → student `uniqueId`.
- Staff and teachers are created by directors or branch staff (no self-join).
- Login/signup: `email` + `password` for all roles; email globally unique. `uniqueId` and `phone` are never credentials; `phone` is contact info only.
- No token refresh in the MVP. `401` → logout → login.

## Lab & Modules
- A Module is a lesson container owned by a teacher and always lives in their Lab.
- The teacher creates the module; AI generates or enhances individual lessons inside it. AI never generates whole modules.
- Connecting to a class (`classId`) is a reference, not a move. Disconnecting leaves it in Lab.
- Teacher and class must share a branch. A class has at most one teacher.
- Unassigning a teacher → class `teacherId = null` + that teacher's modules connected to the class auto-disconnect. Modules are never deleted by assignment changes.

## Visibility
- Student: class info (incl. org logo inherited via branch → org), lessons in connected modules, OWN attendance, ratings and payments only. Never other students' data.
- Parent: read-only view of linked children's classes, attendance, ratings and payments. No mutation buttons on parent pages.
- Teacher: classes they're assigned to, and their own Lab. (ASSUMED)
- Manager / administrator: their branch only. (ASSUMED)
- Director: whole org.

## UI implications
- Hide actions the role can't perform rather than showing disabled buttons, except where a short hint helps.
- Never trust the UI for security: still handle `403` (`error-handling` skill).
