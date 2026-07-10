import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useDataStore } from '@/stores/use-data-store'

export function usePermissions(resource: string) {
  const { currentUser } = useDataStore()
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    loading: true,
  })

  useEffect(() => {
    async function checkPermissions() {
      if (!currentUser) return

      if (currentUser.role?.toUpperCase() === 'ADMIN') {
        setPermissions({
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
          loading: false,
        })
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
            .select('*')
            .eq('role_id', roleData.id)
            .in('resource', [
              resource,
              resource.replace('-', '_'),
              resource.replace('_', '-'),
            ])

          if (permData && permData.length > 0) {
            setPermissions({
              canRead: permData.some((p) => p.can_read === true),
              canCreate: permData.some((p) => p.can_create === true),
              canUpdate: permData.some((p) => p.can_update === true),
              canDelete: permData.some((p) => p.can_delete === true),
              loading: false,
            })
          } else {
            // Fallback: COMMERCIAL users have access via RLS policies
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: false,
              loading: false,
            })
          }
        } else {
          // Fallback: if role not found in roles table, use RLS-based defaults
          setPermissions({
            canRead: true,
            canCreate: true,
            canUpdate: true,
            canDelete: false,
            loading: false,
          })
        }
      } catch (error) {
        console.error('Error checking permission:', error)
        // On error, default to permissive (RLS will enforce actual access)
        setPermissions({
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: false,
          loading: false,
        })
      }
    }

    checkPermissions()
  }, [currentUser, resource])

  return permissions
}
