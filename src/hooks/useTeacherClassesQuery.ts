import { useQuery } from '@tanstack/react-query'
import { listTeacherClasses } from '@/services/teacherClassService'

export function useTeacherClassesQuery(teacherId: string | null | undefined) {
  return useQuery({
    queryKey: ['teacher-classes', teacherId],
    queryFn: () => listTeacherClasses(teacherId!),
    enabled: !!teacherId,
  })
}
