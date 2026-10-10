import { useQuery } from '@tanstack/react-query'
import { listClassModules } from '@/services/teacherClassService'

export function useClassModulesQuery(classId: string | null | undefined) {
  return useQuery({
    queryKey: ['class-modules', classId],
    queryFn: () => listClassModules(classId!),
    enabled: !!classId,
  })
}
