# Edunify — Product Context

Domain and product context for AI assistants working in this repo. This is the what and why. The how — stack, architecture, file conventions, state, forms, design system, tenancy mechanics, roles, response envelopes, the API layer pattern, and the Connect Code format — lives in the rules are not repeated here.

## What it is

Edunify unifies three things learning centers normally stitch together from separate tools: AI-assisted lesson authoring, lesson delivery to students, and day-to-day organization management.

The wedge is the AI lesson builder — a teacher creates a module, then uses AI to generate and enhance individual lessons within it. Generation is a single completion (no token streaming in the UI); the teacher sees the finished lesson and refines from there. Vocabulary audio is generated on demand via cloud text-to-speech.

## Market

Built for Uzbekistan, sold B2B and B2G. Learning centers and tutoring centers are treated identically.

The platform launches free; paid tiers are designed but inactive.

## Product surface

* Authoring — AI-assisted lesson builder.
* Delivery — students work through lessons inside modules connected to their classes.
* Management — branches, classes, enrollment, staff, attendance, ratings and payment records.
* Parent visibility — read-only access to children's data.
* Organization branding — logo and organization-wide color palette.

## Domain entities

### Organization

The tenant.

Owns branches.

Led by a Director.

Contains:

* logo
* light color palette
* dark color palette

Organization branding is inherited everywhere in the system.

### Branch

Operational unit.

Owns classes and staff.

Branch statistics aggregate attendance, ratings and payments.

Branches do not have their own branding.

### Class

Group of students inside a branch.

Classes inherit organization branding.

Classes do not have their own branding.

### Module

Owned by a teacher and always lives in the teacher's Lab.

Connecting a module to a class creates a reference only.

### Lesson

AI assists in generating lesson content.

Attendance and ratings are recorded per lesson.

### Payment

Record only.

No commerce.

### Explore Hub

Edunify-provided modules and lessons only.

No community uploads.

## Roles

### Student

Connected to one or more classes.

Student context derives from connected classes.

### Parent

Linked to students.

Read-only.

Parent context derives entirely from linked students.

## Connecting

Connections may happen through either IDs or Connect Codes.

* Students connect to classes using ID or joinCode.
* Parents connect to students through uniqueId.
* Staff and teachers may be created directly or connected through organization onboarding using IDs or join codes.

Authentication is email + password.

Phone is contact information only.

## Branding

Branding exists only at the organization level.

All roles, branches and classes inherit branding from the organization.

Directors can edit branding in the Theming section.

The Theming section contains separate Light Mode and Dark Mode palettes.

Each color row contains:

* circular color preview
* hex value
* Edit button

The palette follows the same CSS variable structure used by applyTheme().

No branch themes.

No class themes.

No per-user themes.

## Out of scope

* Wildcard subdomains
* Speaking games
* STT
* Pronunciation scoring
* Support Teacher role
* Solo Teacher role
* Multi-org membership
* Timetables
* Community uploads
* Offline support
* Token streaming

## Decisions worth knowing

* Approval over payment.
* AI assists, not replaces.
* Modules live in Lab.
* Students are class-scoped.
* Parents are student-scoped.
* Record-only payments.
* Branch is the operational unit.
* Organization branding is inherited everywhere.
* IDs and Connect Codes coexist.
