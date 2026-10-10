import { useQuery } from '@tanstack/react-query'
import { listClassHomeworks } from '@/services/teacherClassService'

export function useClassHomeworksQuery(classId: string | null | undefined, lessonId: string | null | undefined) {
  return useQuery({
    queryKey: ['class-homeworks', classId, lessonId],
    queryFn: () => listClassHomeworks(classId!, lessonId!),
    enabled: !!classId && !!lessonId,
  })
}
