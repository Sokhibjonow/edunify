import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeClassStudent } from '@/services/teacherClassService'

/** Teacher (class roster) and branch staff (student card). */
export function useRemoveClassStudentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) => removeClassStudent(classId, studentId),
    onSuccess: (_result, { classId }) => {
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] })
      queryClient.invalidateQueries({ queryKey: ['class', classId] })
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] })
      queryClient.invalidateQueries({ queryKey: ['student-lookup', classId] })
      // Branch students, classes, payments and counts all live under ['org', ...]
      queryClient.invalidateQueries({ queryKey: ['org'] })
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
    },
  })
}
