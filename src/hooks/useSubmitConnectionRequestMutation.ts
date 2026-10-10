import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitConnectionRequest } from '@/services/connectionService'
import { useAuthStore } from '@/stores/authStore'
import type { ConnectionRequestInput } from '@/types/connection'

export function useSubmitConnectionRequestMutation() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (input: ConnectionRequestInput) => submitConnectionRequest(input),
    onSuccess: (status) => {
      queryClient.setQueryData(['connection', 'status'], status)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['activeOrganization'] })
      const user = useAuthStore.getState().user
      if (user) {
        setUser({
          ...user,
          connectionStatus: status.connectionStatus,
          requestedBranchId: status.requestedBranchId,
          organizationId: status.organizationId,
          branchId: status.branchId,
        })
      }
    },
  })
}
