import type { Role } from '@/types/auth'

export type RoleConfig = {
  role: Role
  /** URL segment, e.g. 'edunify-admin' for role 'edunify_admin'. */
  slug: string
  /** i18n key under `roles.*` / `landing.*`. */
  i18nKey: string
}

export const ROLES: readonly RoleConfig[] = [
  { role: 'edunify_admin', slug: 'edunify-admin', i18nKey: 'edunifyAdmin' },
  { role: 'director', slug: 'director', i18nKey: 'director' },
  { role: 'manager', slug: 'manager', i18nKey: 'manager' },
  { role: 'administrator', slug: 'administrator', i18nKey: 'administrator' },
  { role: 'teacher', slug: 'teacher', i18nKey: 'teacher' },
  { role: 'student', slug: 'student', i18nKey: 'student' },
  { role: 'parent', slug: 'parent', i18nKey: 'parent' },
] as const

const byRole = new Map(ROLES.map((r) => [r.role, r] as const))

export function roleI18nKey(role: Role): string {
  return byRole.get(role)?.i18nKey ?? role
}

/** edunify_admin is provisioned by the platform, not self-served. */
export function hasSignup(role: Role): boolean {
  return role !== 'edunify_admin'
}
