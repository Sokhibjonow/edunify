import { useQuery } from '@tanstack/react-query'
import { listStudentClasses } from '@/services/studentClassService'

/** While the student has no class yet, poll so the class appears as soon as a teacher adds them. */
export function useStudentClassesQuery(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ['student-classes', studentId],
    queryFn: () => listStudentClasses(studentId!),
    enabled: !!studentId,
    refetchInterval: (query) => (query.state.data?.length === 0 ? 15_000 : false),
  })
}
