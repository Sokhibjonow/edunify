/** i18n keys for authenticated route page titles. `null` = home (no suffix). */
export const AUTH_ROUTE_TITLE_KEYS: Record<string, string | null> = {
  '/home': null,
  '/profile': 'profile.title',
  '/profile/change-password': 'profile.changePassword',
  '/appearance': 'appearance.title',
  '/home/appearance': 'appearance.title',
  '/management': 'header.management',
  '/payments': 'staffNav.payments',
  '/classes': 'staffNav.classes',
  '/students': 'staffNav.students',
}
