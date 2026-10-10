import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addExistingStudentToClass } from '@/services/teacherClassService'

export function useAddExistingStudentMutation(classId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uniqueId: string) => addExistingStudentToClass(classId, uniqueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] })
      queryClient.invalidateQueries({ queryKey: ['class', classId] })
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] })
      queryClient.invalidateQueries({ queryKey: ['student-lookup', classId] })
    },
  })
}
