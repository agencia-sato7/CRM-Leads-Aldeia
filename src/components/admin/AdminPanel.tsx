import { useState } from 'react'
import {
  Lock,
  Unlock,
  DollarSign,
  Trophy,
  MessageSquare,
  Paperclip,
  Send,
} from 'lucide-react'
import { useDataStore } from '@/stores/use-data-store'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export function AdminPanel() {
  const {
    users,
    leads,
    opportunities,
    currentUser,
    updateUser,
    addMessage,
    resources,
  } = useDataStore()

  const [selectedUser, setSelectedUser] = useState<string>('')
  const [msgText, setMsgText] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [selectedResources, setSelectedResources] = useState<string[]>([])

  if (!currentUser) return null

  const commercialUsers = users.filter((u) => u.role === 'COMMERCIAL')

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(v)
  const formatUSD = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(v)

  const openOpps = opportunities.filter((o) => o.status === 'Aberta')

  const openOppsBRL = openOpps.filter(
    (o) => leads.find((l) => l.id === o.leadId)?.country === 'Brazil',
  )
  const openOppsUSD = openOpps.filter(
    (o) => leads.find((l) => l.id === o.leadId)?.country === 'USA',
  )

  const openValueBRL = openOppsBRL.reduce((acc, o) => acc + o.value, 0)
  const openValueUSD = openOppsUSD.reduce((acc, o) => acc + o.value, 0)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !msgText) return

    const selectedUrls = selectedResources
      .map((id) => resources.find((r) => r.id === id)?.url)
      .filter(Boolean)
      .join('\n')

    const finalText = selectedUrls
      ? `${msgText}\n\nMateriais Anexados:\n${selectedUrls}`
      : msgText

    addMessage({
      fromId: currentUser.id,
      toId: selectedUser,
      text: finalText,
      fileUrl: fileUrl || undefined,
    })
    toast.success('Mensagem enviada com sucesso!')
    setMsgText('')
    setFileUrl('')
    setSelectedResources([])
  }

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4 text-emerald-600">
            <DollarSign className="w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900">
              Orçamentos Abertos (Real BRL)
            </h2>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">
            {formatBRL(openValueBRL)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {openOppsBRL.length} propostas ativas
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4 text-blue-600">
            <DollarSign className="w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900">
              Orçamentos Abertos (Dólar USD)
            </h2>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">
            {formatUSD(openValueUSD)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {openOppsUSD.length} propostas ativas
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 mb-6">
        <RevenueChart />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-gray-900">
              Ranking de Performance de Vendas
            </h2>
          </div>
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-center">
                  Orçamentos Realizados
                </TableHead>
                <TableHead className="text-center">
                  Valor Total Orçado
                </TableHead>
                <TableHead className="text-center">
                  Orçamentos Fechados
                </TableHead>
                <TableHead className="text-center">Conversão</TableHead>
                <TableHead className="text-right">Bloqueio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commercialUsers
                .map((user) => {
                  const userOpps = opportunities.filter(
                    (o) => o.userId === user.id,
                  )
                  const wonOpps = userOpps.filter((o) => o.status === 'Ganha')
                  const convRate =
                    userOpps.length > 0
                      ? (wonOpps.length / userOpps.length) * 100
                      : 0
                  const totalValue = userOpps.reduce(
                    (acc, o) => acc + (o.value || 0),
                    0,
                  )
                  return {
                    user,
                    userOpps: userOpps.length,
                    totalValue,
                    wonOpps: wonOpps.length,
                    convRate,
                  }
                })
                .sort((a, b) => b.totalValue - a.totalValue)
                .map(
                  (
                    { user, userOpps, totalValue, wonOpps, convRate },
                    index,
                  ) => (
                    <TableRow key={user.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-semibold text-gray-900 flex items-center gap-2">
                        {index === 0 && (
                          <Trophy className="w-4 h-4 text-yellow-500" />
                        )}
                        {user.name}
                      </TableCell>
                      <TableCell className="text-center font-medium text-gray-600">
                        {userOpps}
                      </TableCell>
                      <TableCell className="text-center font-medium text-gray-700">
                        {formatBRL(totalValue)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-green-600">
                        {wonOpps}
                      </TableCell>
                      <TableCell className="text-center font-bold text-gray-900">
                        {convRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={user.isLocked}
                            onCheckedChange={(v) =>
                              updateUser(user.id, { isLocked: v })
                            }
                            className="data-[state=checked]:bg-red-600"
                          />
                          {user.isLocked ? (
                            <Badge
                              variant="destructive"
                              className="bg-red-100 text-red-700 hover:bg-red-100"
                            >
                              <Lock className="w-3 h-3 mr-1" /> Bloqueado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              <Unlock className="w-3 h-3 mr-1" /> Ativo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                )}
            </TableBody>
          </Table>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-900">
              Central de Comunicação Interna
            </h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <form
              onSubmit={handleSendMessage}
              className="space-y-4 flex-1 flex flex-col"
            >
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Para qual Vendedor?
                </label>
                <Select
                  value={selectedUser}
                  onValueChange={setSelectedUser}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um membro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {commercialUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">
                  Mensagem / Feedback
                </label>
                <textarea
                  required
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  className="w-full h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none"
                  placeholder="Instruções, feedback de ligação..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-gray-400" /> Anexar
                  Materiais
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto p-1 mb-3">
                  {resources.length === 0 ? (
                    <div className="col-span-full text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-gray-100">
                      Nenhum material no repositório.
                    </div>
                  ) : (
                    resources.map((res) => (
                      <label
                        key={res.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedResources.includes(res.id)
                            ? 'border-indigo-600 bg-indigo-50/50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <Checkbox
                          checked={selectedResources.includes(res.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedResources((prev) => [...prev, res.id])
                            } else {
                              setSelectedResources((prev) =>
                                prev.filter((id) => id !== res.id),
                              )
                            }
                          }}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium text-gray-900 truncate"
                            title={res.title}
                          >
                            {res.title}
                          </p>
                          <p
                            className="text-xs text-gray-500 truncate"
                            title={res.desc || ''}
                          >
                            {res.desc || 'Sem descrição'}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <Input
                  type="url"
                  placeholder="Ou cole uma URL externa: https://..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" /> Enviar Mensagem
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
