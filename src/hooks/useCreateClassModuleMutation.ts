import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClassModule } from '@/services/teacherClassService'
import type { CreateTitleInput } from '@/types/teacherClass'

export function useCreateClassModuleMutation(classId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTitleInput) => createClassModule(classId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-modules', classId] })
    },
  })
}
