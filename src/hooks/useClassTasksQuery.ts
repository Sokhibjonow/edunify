import { useQuery } from '@tanstack/react-query'
import { listClassTasks } from '@/services/teacherClassService'

export function useClassTasksQuery(classId: string | null | undefined) {
  return useQuery({
    queryKey: ['class-tasks', classId],
    queryFn: () => listClassTasks(classId!),
    enabled: !!classId,
  })
}
