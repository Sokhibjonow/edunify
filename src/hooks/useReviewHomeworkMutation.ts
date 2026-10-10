import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewHomework } from '@/services/teacherClassService'

export function useReviewHomeworkMutation(classId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (homeworkId: string) => reviewHomework(homeworkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-homeworks', classId] })
    },
  })
}
