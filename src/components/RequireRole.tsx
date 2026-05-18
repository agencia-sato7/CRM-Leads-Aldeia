import { Navigate } from 'react-router-dom'
import { useDataStore } from '@/stores/use-data-store'

export function RequireRole({
  children,
  role,
}: {
  children: React.ReactNode
  role: string
}) {
  const { currentUser } = useDataStore()

  if (!currentUser) {
    return null
  }

  if (currentUser.role !== role) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
