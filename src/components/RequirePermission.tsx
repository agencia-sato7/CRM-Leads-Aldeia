import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { useDataStore } from '@/stores/use-data-store'

export function RequirePermission({
  children,
  resource,
}: {
  children: React.ReactNode
  resource: string
}) {
  const { currentUser } = useDataStore()
  const { canRead, loading } = usePermissions(resource)

  if (!currentUser || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!canRead) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
