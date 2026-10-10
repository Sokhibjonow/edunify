import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTeacherClass } from '@/services/teacherClassService'

export function useCreateTeacherClassMutation(teacherId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { name: string }) => createTeacherClass(teacherId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-classes', teacherId] })
    },
  })
}
