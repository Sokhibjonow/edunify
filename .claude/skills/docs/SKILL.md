---
name: docs
description: Use when finishing a feature or fix that changes architecture, data flow, domain rules, conventions, routes, or adds tech debt; or when asked to create or update project docs.
---

# Updating docs

Docs live in `docs/` and must stay true to the code. They are read on demand, so keep them accurate and skimmable.

## What goes where
| Change | Update |
|---|---|
| New layer, store, provider, route group, data flow | `docs/ARCHITECTURE.md` |
| Roles, permissions, entities, business rules | `docs/DOMAIN.md` |
| New pattern others should copy | `docs/CONVENTIONS.md` (with a real file path as the example) |
| Shortcut, workaround, known bug | `docs/TECH_DEBT.md` |
| Unresolved requirement or ambiguity | `docs/OPEN_QUESTIONS.md` |
| Feature or fix shipped | `docs/CHANGELOG.md` (one line: date, type, summary, branch) |

## Rules
- Edit only the affected section. No rewrites, no filler, no marketing tone.
- Facts from code only; reference real paths (`src/...`).
- Delete statements the change made false.
- Resolved open question → move the answer into the right doc and delete it from `OPEN_QUESTIONS.md`.
- Domain rule changes must also be reflected in `.claude/skills/domain-model/SKILL.md` (flag this to the user; don't edit skills silently).
- Pure refactors with no behavior or pattern change need no doc update.
- Commit docs in the same commit as the code they describe (`docs:` prefix only for docs-only commits).

## Entry formats

```markdown
<!-- TECH_DEBT.md -->
## <short title>
- Severity: high | medium | low
- Where: `src/...`
- Why it exists:
- Fix:
```

```markdown
<!-- OPEN_QUESTIONS.md -->
## <question>
- Context: `src/...`
- Options: A) … B) …
- Current assumption:
```

```markdown
<!-- CHANGELOG.md (newest first) -->
- 2026-10-04 — feat — Teacher can connect modules to classes — `feat/module-connect`
```

## If `docs/` doesn't exist yet
Create the six files with a title and empty sections, then fill only what the current change touches. Don't invent content.
