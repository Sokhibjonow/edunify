import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addStudentToClass } from '@/services/teacherClassService'

export function useAddStudentToClassMutation(classId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { name: string; surname: string }) => addStudentToClass(classId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] })
      queryClient.invalidateQueries({ queryKey: ['class', classId] })
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] })
    },
  })
}
