import { useQuery } from '@tanstack/react-query'
import { getClass } from '@/services/teacherClassService'

export function useClassQuery(classId: string | null | undefined) {
  return useQuery({
    queryKey: ['class', classId],
    queryFn: () => getClass(classId!),
    enabled: !!classId,
  })
}
