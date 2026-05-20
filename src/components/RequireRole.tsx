import { Navigate } from 'react-router-dom'
import { useDataStore } from '@/stores/use-data-store'

export function RequireRole({
  children,
  role,
  roles,
}: {
  children: React.ReactNode
  role?: string
  roles?: string[]
}) {
  const { currentUser } = useDataStore()

  if (!currentUser) {
    return null
  }

  const allowedRoles = roles || (role ? [role] : [])

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
