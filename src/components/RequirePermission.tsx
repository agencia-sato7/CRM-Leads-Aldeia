import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useDataStore } from '@/stores/use-data-store'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export function RequirePermission({
  children,
  resource,
}: {
  children: React.ReactNode
  resource: string
}) {
  const { currentUser } = useDataStore()
  const { is2FAVerified } = useAuth()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkPermission() {
      if (!currentUser) return

      if (currentUser.role === 'ADMIN') {
        setHasPermission(true)
        return
      }

      try {
        const { data: roleData } = await supabase
          .from('roles')
          .select('id')
          .ilike('name', currentUser.role)
          .maybeSingle()

        if (roleData) {
          const { data: permData } = await supabase
            .from('role_permissions')
            .select('can_read')
            .eq('role_id', roleData.id)
            .in('resource', [
              resource,
              resource.replace('-', '_'),
              resource.replace('_', '-'),
            ])

          if (permData && permData.length > 0) {
            setHasPermission(permData.some((p) => p.can_read === true))
          } else {
            setHasPermission(false)
          }
        } else {
          setHasPermission(false)
        }
      } catch (error) {
        console.error('Error checking permission:', error)
        setHasPermission(false)
      }
    }

    checkPermission()
  }, [currentUser, resource])

  if (!is2FAVerified) {
    return null
  }

  if (!currentUser || hasPermission === null) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!hasPermission) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
