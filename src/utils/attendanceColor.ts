export function attendanceTextClass(pct: number): string {
  if (pct < 70) return 'text-[var(--color-error-text)]'
  if (pct < 85) return 'text-[var(--color-warning-text)]'
  return 'text-[var(--color-success-text)]'
}
