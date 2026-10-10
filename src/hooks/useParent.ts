import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getChildOverview,
  linkParent,
  listParentChildren,
  listStudentParents,
  lookupParent,
  unlinkParent,
} from '@/services/parentService'
import { isConnectCode } from '@/utils/connectCode'

/** While no child is linked yet, poll so the child appears as soon as staff link the parent. */
export function useParentChildrenQuery(parentId: string | null | undefined) {
  return useQuery({
    queryKey: ['parent-children', parentId],
    queryFn: () => listParentChildren(parentId!),
    enabled: !!parentId,
    refetchInterval: (query) => (query.state.data?.length === 0 ? 15_000 : false),
  })
}

export function useChildOverviewQuery(parentId: string | null | undefined, studentId: string | undefined) {
  return useQuery({
    queryKey: ['child-overview', parentId, studentId],
    queryFn: () => getChildOverview(parentId!, studentId!),
    enabled: !!parentId && !!studentId,
  })
}

export function useStudentParentsQuery(orgId: string, branchId: string, studentId: string) {
  return useQuery({
    queryKey: ['org', orgId, 'branches', branchId, 'student-parents', studentId],
    queryFn: () => listStudentParents(orgId, branchId, studentId),
  })
}

export function useParentLookupQuery(orgId: string, branchId: string, uniqueId: string) {
  return useQuery({
    queryKey: ['org', orgId, 'branches', branchId, 'parent-lookup', uniqueId],
    queryFn: () => lookupParent(orgId, branchId, uniqueId),
    enabled: isConnectCode(uniqueId),
    retry: false,
  })
}

export function useLinkParentMutation(orgId: string, branchId: string, studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (parentId: string) => linkParent(orgId, branchId, studentId, parentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org', orgId, 'branches', branchId, 'student-parents', studentId] }),
  })
}

export function useUnlinkParentMutation(orgId: string, branchId: string, studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (parentId: string) => unlinkParent(orgId, branchId, studentId, parentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org', orgId, 'branches', branchId, 'student-parents', studentId] }),
  })
}
