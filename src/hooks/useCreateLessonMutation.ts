import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createLesson } from '@/services/teacherClassService'
import type { CreateTitleInput } from '@/types/teacherClass'

export function useCreateLessonMutation(classId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ moduleId, ...input }: CreateTitleInput & { moduleId: string }) => createLesson(moduleId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-modules', classId] })
    },
  })
}
