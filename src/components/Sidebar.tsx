import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Handshake,
  FileText,
  Rocket,
  FolderOpen,
  ShieldCheck,
  UserCog,
  Key,
  Building2,
  PackageSearch,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useDataStore } from '@/stores/use-data-store'
import { supabase } from '@/lib/supabase/client'

export function Sidebar() {
  const location = useLocation()
  const { currentUser } = useDataStore()
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function loadPermissions() {
      if (!currentUser) return

      if (currentUser.role === 'ADMIN') {
        return
      }

      try {
        const { data: roleData } = await supabase
          .from('roles')
          .select('id')
          .eq('name', currentUser.role)
          .maybeSingle()

        if (roleData) {
          const { data: perms } = await supabase
            .from('role_permissions')
            .select('resource, can_read')
            .eq('role_id', roleData.id)

          if (perms) {
            const permMap: Record<string, boolean> = {}
            perms.forEach((p) => {
              permMap[p.resource] = p.can_read || false
              permMap[p.resource.replace('_', '-')] = p.can_read || false
              permMap[p.resource.replace('-', '_')] = p.can_read || false
            })
            setPermissions(permMap)
          }
        }
      } catch (error) {
        console.error('Error loading sidebar permissions:', error)
      }
    }
    loadPermissions()
  }, [currentUser])

  if (!currentUser) return null

  const baseNavItems = [
    { icon: LayoutDashboard, label: 'Painel', path: '/' },
    { icon: Users, label: 'Leads', path: '/leads', resource: 'leads' },
    {
      icon: Handshake,
      label: 'Oportunidades',
      path: '/opportunities',
      resource: 'opportunities',
    },
    {
      icon: Building2,
      label: 'Clientes',
      path: '/customers',
      resource: 'customers',
    },
    {
      icon: PackageSearch,
      label: 'Produtos',
      path: '/products',
      resource: 'products',
    },
    {
      icon: Rocket,
      label: 'Onboarding',
      path: '/onboarding',
      resource: 'onboarding',
    },
    {
      icon: FileText,
      label: 'Tabela de Preços',
      path: '/price-table',
      resource: 'price-table',
    },
    {
      icon: FolderOpen,
      label: 'Materiais',
      path: '/resources',
      resource: 'resources',
    },
  ]

  const navItems = baseNavItems.filter((item) => {
    if (currentUser.role === 'ADMIN') return true
    if (!item.resource) return true // dashboard sempre visível
    return permissions[item.resource] === true
  })

  if (currentUser.role === 'ADMIN') {
    navItems.push({ icon: UserCog, label: 'Equipe', path: '/team' })
    navItems.push({ icon: Key, label: 'Controle de Acesso', path: '/roles' })
    navItems.push({ icon: ShieldCheck, label: 'Gestão Admin', path: '/admin' })
  }

  return (
    <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-4 bg-black/95 text-white py-6 px-3 rounded-full shadow-2xl shadow-black/20 border border-white/10">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Tooltip key={item.path}>
            <TooltipTrigger asChild>
              <Link
                to={item.path}
                className={cn(
                  'p-3 rounded-full transition-all duration-300 hover:bg-white/20 relative group',
                  isActive
                    ? 'bg-[#227b50] text-white hover:bg-[#227b50] shadow-lg shadow-[#227b50]/30'
                    : 'text-white/70',
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-black text-white border-0 ml-2"
            >
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </aside>
  )
}
