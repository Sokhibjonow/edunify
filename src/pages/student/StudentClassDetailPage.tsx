import { useParams } from 'react-router-dom'
import ClassroomShell from '@/components/classroom/ClassroomShell'
import StudentHomeworkTab from '@/components/student/StudentHomeworkTab'

export default function StudentClassDetailPage() {
  const { classId } = useParams<{ classId: string }>()
  if (!classId) return null

  return (
    <ClassroomShell
      classId={classId}
      backTo="/home"
      canEdit={false}
      renderHomework={(lesson) => <StudentHomeworkTab key={lesson?.id ?? 'none'} classId={classId} lesson={lesson} />}
    />
  )
}
