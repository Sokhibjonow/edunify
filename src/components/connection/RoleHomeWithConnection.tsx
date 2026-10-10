import type { ComponentType, ReactNode } from 'react'
import RoleHome from '@/components/layout/RoleHome'
import Spinner from '@/components/ui/Spinner'
import OrganizationConnectionPage from '@/components/connection/OrganizationConnectionPage'
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery'
import { useConnectionStatusQuery } from '@/hooks/useConnectionStatusQuery'

type Props = {
  i18nKey: string
  pageClassName: string
  /** Header component forwarded to `RoleHome`. Defaults to the shared `AppHeader`. */
  header?: ComponentType
  /** Rendered once connected, in place of the default `RoleHome` welcome view. */
  connectedContent?: ReactNode
}

export default function RoleHomeWithConnection({
  i18nKey,
  pageClassName,
  header,
  connectedContent,
}: Props) {
  const { data: user, isLoading: userLoading } = useCurrentUserQuery()
  const { data: status, isLoading: statusLoading } = useConnectionStatusQuery()

  if (userLoading || statusLoading) {
    return (
      <main className={`${pageClassName} mx-auto max-w-sm p-3`}>
        <Spinner />
      </main>
    )
  }

  const connectionStatus = status?.connectionStatus ?? user?.connectionStatus
  const requestedBranchId = status?.requestedBranchId ?? user?.requestedBranchId

  if (connectionStatus === 'unconnected') {
    return <OrganizationConnectionPage requestedBranchId={requestedBranchId} />
  }

  if (connectedContent) return <>{connectedContent}</>

  return <RoleHome i18nKey={i18nKey} header={header} />
}
