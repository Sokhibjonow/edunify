/** Day/month as zero-padded `dd/mm` (e.g. "02/06") from an ISO string. */
export function formatDayMonth(iso: string): string {
  const date = new Date(iso)
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}
