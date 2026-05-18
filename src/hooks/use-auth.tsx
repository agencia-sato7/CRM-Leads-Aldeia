import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: any; requires2FA?: boolean }>
  signOut: () => Promise<{ error: any }>
  verify2FA: (code: string) => Promise<boolean>
  send2FA: (userId: string, email: string) => Promise<{ error: any }>
  is2FAVerified: boolean
  set2FAVerified: (status: boolean) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [is2FAVerified, setIs2FAVerified] = useState(
    sessionStorage.getItem('2fa_verified') === 'true',
  )

  useEffect(() => {
    let mounted = true

    const check2FA = (session: Session | null) => {
      if (session?.user && !sessionStorage.getItem('2fa_verified')) {
        supabase
          .from('profiles')
          .select('two_factor_enabled')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (mounted && data && data.two_factor_enabled === false) {
              sessionStorage.setItem('2fa_verified', 'true')
              setIs2FAVerified(true)
            }
            if (mounted) setLoading(false)
          })
          .catch(() => {
            if (mounted) setLoading(false)
          })
      } else {
        if (mounted) setLoading(false)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('2fa_verified')
        setIs2FAVerified(false)
        setLoading(false)
      } else if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'INITIAL_SESSION'
      ) {
        check2FA(session)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      check2FA(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const send2FA = async (userId: string, email: string) => {
    return await supabase.functions.invoke('send-2fa-email', {
      body: { userId, email },
    })
  }

  const verify2FA = async (code: string) => {
    const targetUserId = session?.user?.id || user?.id
    if (!targetUserId) return false

    const { data, error } = await supabase
      .from('profiles')
      .select('two_factor_code, two_factor_expires_at')
      .eq('id', targetUserId)
      .single()

    if (error) {
      console.error('Error fetching 2FA code:', error)
      return false
    }

    if (data && data.two_factor_code === code) {
      // Validate expiration with leeway for client clock drift
      const expiresAt = data.two_factor_expires_at
        ? new Date(data.two_factor_expires_at).getTime()
        : 0
      const now = Date.now()

      // Allow if expiration is strictly not in the deep past (e.g., more than 1 hour ago)
      // This protects against users with wrong computer clocks
      const isNotDeeplyExpired = now - expiresAt < 60 * 60 * 1000

      if (isNotDeeplyExpired) {
        sessionStorage.setItem('2fa_verified', 'true')
        setIs2FAVerified(true)

        // Clear code
        await supabase
          .from('profiles')
          .update({ two_factor_code: null, two_factor_expires_at: null })
          .eq('id', targetUserId)

        return true
      } else {
        console.error('2FA code is expired', { expiresAt, now })
      }
    } else {
      console.error('2FA code mismatch or not found')
    }
    return false
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    return { error }
  }
  const signIn = async (email: string, password: string) => {
    sessionStorage.removeItem('2fa_verified')
    setIs2FAVerified(false)
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error && data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profile && profile.two_factor_enabled === false) {
        sessionStorage.setItem('2fa_verified', 'true')
        setIs2FAVerified(true)
        return { error, requires2FA: false }
      }

      await send2FA(data.user.id, email)
      return { error, requires2FA: true }
    }

    return { error, requires2FA: false }
  }
  const signOut = async () => {
    sessionStorage.removeItem('2fa_verified')
    setIs2FAVerified(false)
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        signUp,
        signIn,
        signOut,
        verify2FA,
        send2FA,
        is2FAVerified,
        set2FAVerified: setIs2FAVerified,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
