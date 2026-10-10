import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignBranchTeacher } from '@/services/branchService'
import type { AssignBranchTeacherInput } from '@/types/branch'

export function useAssignBranchTeacherMutation(orgId: string, branchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignBranchTeacherInput) => assignBranchTeacher(orgId, branchId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchTeachers', orgId] })
      queryClient.invalidateQueries({ queryKey: ['org', orgId] })
      queryClient.invalidateQueries({ queryKey: ['statistics', orgId] })
    },
  })
}
