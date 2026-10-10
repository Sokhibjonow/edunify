import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask } from '@/services/teacherClassService'
import type { CreateTaskInput } from '@/types/teacherClass'

export function useCreateTaskMutation(classId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(classId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-tasks', classId] })
    },
  })
}
