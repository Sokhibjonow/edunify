import { useTranslation } from 'react-i18next'
import { FileText, Clock, CheckCircle2 } from 'lucide-react'
import type { HomeworkStatus } from '@/types/teacherClass'

const statusConfig: Record<HomeworkStatus, { color: string; icon: typeof CheckCircle2 }> = {
  reviewed: { color: 'text-[var(--color-success-text)] bg-[var(--color-success-soft)]', icon: CheckCircle2 },
  submitted: { color: 'text-[var(--color-primary)] bg-[var(--color-accent-soft)]', icon: FileText },
  late: { color: 'text-[var(--color-warning-text)] bg-[var(--color-warning-soft)]', icon: Clock },
}

export default function HomeworkStatusBadge({ status }: { status: HomeworkStatus }) {
  const { t } = useTranslation()
  const { color, icon: Icon } = statusConfig[status]
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Icon size={11} strokeWidth={2} />
      {t(`teacherClass.${status}`)}
    </span>
  )
}
