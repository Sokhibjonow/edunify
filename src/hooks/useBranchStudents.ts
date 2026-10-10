import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enrollBranchStudent, listBranchStudents, lookupBranchStudent } from '@/services/branchStudentService'
import { isConnectCode } from '@/utils/connectCode'
import type { EnrollBranchStudentInput } from '@/types/branchStudent'

export function useBranchStudentsQuery(orgId: string | null | undefined, branchId: string | null | undefined) {
  return useQuery({
    queryKey: ['org', orgId, 'branches', branchId, 'students'],
    queryFn: () => listBranchStudents(orgId!, branchId!),
    enabled: !!orgId && !!branchId,
  })
}

export function useBranchStudentLookupQuery(orgId: string, branchId: string, uniqueId: string) {
  return useQuery({
    queryKey: ['org', orgId, 'branches', branchId, 'student-lookup', uniqueId],
    queryFn: () => lookupBranchStudent(orgId, branchId, uniqueId),
    enabled: isConnectCode(uniqueId),
    retry: false,
  })
}

/** Enrolling changes the class roster, billing, the branch student count and statistics. */
export function useEnrollBranchStudentMutation(orgId: string, branchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EnrollBranchStudentInput) => enrollBranchStudent(orgId, branchId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', orgId, 'branches', branchId] })
      queryClient.invalidateQueries({ queryKey: ['statistics', orgId] })
    },
  })
}
