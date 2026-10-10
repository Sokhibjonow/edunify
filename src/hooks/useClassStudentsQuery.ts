import { useQuery } from '@tanstack/react-query'
import { listClassStudents } from '@/services/teacherClassService'

export function useClassStudentsQuery(classId: string | null | undefined) {
  return useQuery({
    queryKey: ['class-students', classId],
    queryFn: () => listClassStudents(classId!),
    enabled: !!classId,
  })
}
