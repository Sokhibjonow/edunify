import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeBranchTeacher } from '@/services/branchService'

export function useRemoveBranchTeacherMutation(orgId: string, branchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (teacherId: string) => removeBranchTeacher(orgId, branchId, teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchTeachers', orgId] })
      queryClient.invalidateQueries({ queryKey: ['org', orgId] })
      queryClient.invalidateQueries({ queryKey: ['statistics', orgId] })
    },
  })
}
