import { ShieldCheck } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { AdminRepository } from '@/components/admin/AdminRepository'
import { AdminAccount } from '@/components/admin/AdminAccount'
import { RevenueChart } from '@/components/dashboard/RevenueChart'

export default function Admin() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#227b50] text-white rounded-xl shadow-lg shadow-[#227b50]/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel Admin</h1>
            <p className="text-muted-foreground text-sm">
              Gestão estratégica, materiais e configurações
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="panel" className="space-y-6">
        <TabsList className="bg-white border border-gray-100 shadow-sm p-1 rounded-xl">
          <TabsTrigger value="panel" className="rounded-lg">
            Painel Estratégico
          </TabsTrigger>
          <TabsTrigger value="repository" className="rounded-lg">
            Repositório Comercial
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg">
            Minha Conta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="panel" className="outline-none space-y-6">
          <RevenueChart />
          <AdminPanel />
        </TabsContent>

        <TabsContent value="repository" className="outline-none">
          <AdminRepository />
        </TabsContent>

        <TabsContent value="account" className="outline-none">
          <AdminAccount />
        </TabsContent>
      </Tabs>
    </div>
  )
}
