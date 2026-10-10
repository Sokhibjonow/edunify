import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import ClassroomShell from '@/components/classroom/ClassroomShell'
import HomeworksTab from '@/components/teacher/HomeworksTab'
import ClassStudentsModal from '@/components/teacher/ClassStudentsModal'
import AttendanceRegister from '@/components/teacher/AttendanceRegister'

export default function TeacherClassDetailPage() {
  const { classId } = useParams<{ classId: string }>()
  const location = useLocation()
  const { t } = useTranslation()
  const [studentsOpen, setStudentsOpen] = useState(
    () => (location.state as { openStudents?: boolean } | null)?.openStudents === true,
  )

  if (!classId) return null

  return (
    <ClassroomShell
      classId={classId}
      backTo="/classes"
      canEdit
      headerAction={(cls) => (
        <>
          <button
            type="button"
            onClick={() => setStudentsOpen(true)}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
          >
            <Users size={16} strokeWidth={1.8} />
            <span className="tabular-nums">{cls?.studentIds.length ?? 0}</span>
            <span className="hidden sm:inline">{t('teacherClass.students')}</span>
          </button>
          {studentsOpen && (
            <ClassStudentsModal classId={classId} className={cls?.name ?? ''} onClose={() => setStudentsOpen(false)} />
          )}
        </>
      )}
      renderHomework={(lesson) => <HomeworksTab classId={classId} lesson={lesson} />}
      renderLessonExtra={(lesson, lessons) => <AttendanceRegister classId={classId} lesson={lesson} lessons={lessons} />}
    />
  )
}
