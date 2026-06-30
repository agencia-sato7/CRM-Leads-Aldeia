import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import Index from './pages/Index'
import Leads from './pages/Leads'
import Opportunities from './pages/Opportunities'
import Onboarding from './pages/Onboarding'
import Resources from './pages/Resources'
import Admin from './pages/Admin'
import Team from './pages/Team'
import Roles from './pages/Roles'
import Customers from './pages/Customers'
import AdminLogs from './pages/AdminLogs'
import Products from './pages/Products'
import MonthlyResults from './pages/MonthlyResults'
import NotFound from './pages/NotFound'
import Docs from './pages/Docs'
import { RequireRole } from './components/RequireRole'
import { RequirePermission } from './components/RequirePermission'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { useDataStore } from './stores/use-data-store'
import { AuthProvider, useAuth } from './hooks/use-auth'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }
  if (!session)
    return <Navigate to="/login" state={{ from: location }} replace />

  return <>{children}</>
}

const DataInitializer = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth()
  const fetchInitialData = useDataStore((s) => s.fetchInitialData)

  useEffect(() => {
    if (session?.user?.id) {
      fetchInitialData()
    }
  }, [session?.user?.id, fetchInitialData])

  return <>{children}</>
}

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DataInitializer>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/docs" element={<Docs />} />

            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Index />} />
              <Route
                path="/leads"
                element={
                  <RequirePermission resource="leads">
                    <Leads />
                  </RequirePermission>
                }
              />
              <Route
                path="/opportunities"
                element={
                  <RequirePermission resource="opportunities">
                    <Opportunities />
                  </RequirePermission>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <RequirePermission resource="onboarding">
                    <Onboarding />
                  </RequirePermission>
                }
              />
              <Route
                path="/resources"
                element={
                  <RequireRole roles={['ADMIN', 'COMMERCIAL']}>
                    <Resources />
                  </RequireRole>
                }
              />
              <Route
                path="/team"
                element={
                  <RequireRole role="ADMIN">
                    <Team />
                  </RequireRole>
                }
              />
              <Route
                path="/customers"
                element={
                  <RequirePermission resource="customers">
                    <Customers />
                  </RequirePermission>
                }
              />
              <Route
                path="/products"
                element={
                  <RequirePermission resource="products">
                    <Products />
                  </RequirePermission>
                }
              />
              <Route
                path="/monthly-results"
                element={
                  <RequireRole roles={['ADMIN', 'COMMERCIAL']}>
                    <MonthlyResults />
                  </RequireRole>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireRole role="ADMIN">
                    <Admin />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/logs"
                element={
                  <RequireRole role="ADMIN">
                    <AdminLogs />
                  </RequireRole>
                }
              />
              <Route
                path="/roles"
                element={
                  <RequireRole role="ADMIN">
                    <Roles />
                  </RequireRole>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DataInitializer>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
