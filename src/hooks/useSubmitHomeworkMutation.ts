import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitHomework } from '@/services/studentClassService'
import type { SubmitHomeworkInput } from '@/types/teacherClass'

export function useSubmitHomeworkMutation(classId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SubmitHomeworkInput) => submitHomework(classId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-homeworks', classId] })
    },
  })
}
