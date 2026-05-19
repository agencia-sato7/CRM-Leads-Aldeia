import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useDataStore } from '@/stores/use-data-store'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import logoUrl from '@/assets/logo-dtosb2yn-68c37.png'

export default function Layout() {
  const { currentUser, logout } = useDataStore()
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    const currentAvatar =
      (currentUser as any)?.avatar_url || user?.user_metadata?.avatar_url
    if (currentAvatar) {
      setAvatar(currentAvatar)
    }

    if (currentUser?.id) {
      supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', currentUser.id)
        .single()
        .then(({ data }) => {
          if (data?.avatar_url) setAvatar(data.avatar_url)
        })

      const channel = supabase
        .channel('profile_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${currentUser.id}`,
          },
          (payload) => {
            if (payload.new && (payload.new as any).avatar_url) {
              setAvatar((payload.new as any).avatar_url)
            }
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [currentUser, user])

  const handleLogout = async () => {
    await signOut()
    if (logout) logout()
    navigate('/login')
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 md:ml-20 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center">
            <img
              src={logoUrl}
              alt="Aldeia Acabamentos"
              className="h-8 object-contain"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-r pr-6 border-gray-100">
              {avatar ? (
                <img
                  src={avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200 shrink-0"
                  onError={() => setAvatar(null)}
                />
              ) : (
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm shadow-inner shrink-0 uppercase">
                  {currentUser.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900 leading-none">
                  {currentUser.name}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-none">
                  {currentUser.role === 'ADMIN' ? 'Administrador' : 'Comercial'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm ml-2"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
