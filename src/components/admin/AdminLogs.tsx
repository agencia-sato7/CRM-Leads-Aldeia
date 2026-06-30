import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ScrollText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Eye,
  Inbox,
  Loader2,
  User,
  Activity,
  FileClock,
} from 'lucide-react'
import { useDataStore } from '@/stores/use-data-store'
import { fetchAuditLogs, AuditLog } from '@/services/audit-logs'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'

const ACTION_LABELS: Record<string, string> = {
  INSERT: 'Inclusão',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
}

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
}

const ENTITY_LABELS: Record<string, string> = {
  leads: 'Lead',
  meetings: 'Reunião',
  opportunities: 'Oportunidade',
  customers: 'Cliente',
}

function formatMetadata(log: AuditLog): {
  label: string
  changes: Array<{ field: string; from: any; to: any }>
} {
  const meta = log.metadata || {}
  const before = meta.before || {}
  const after = meta.after || {}
  const changes: Array<{ field: string; from: any; to: any }> = []

  if (log.action_type === 'INSERT') {
    Object.keys(after).forEach((key) => {
      changes.push({ field: key, from: null, to: after[key] })
    })
    return { label: `Novo registro criado`, changes }
  }

  if (log.action_type === 'DELETE') {
    Object.keys(before).forEach((key) => {
      changes.push({ field: key, from: before[key], to: null })
    })
    return { label: `Registro removido`, changes }
  }

  Object.keys(after).forEach((key) => {
    const oldVal = before[key]
    const newVal = after[key]
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ field: key, from: oldVal, to: newVal })
    }
  })

  return { label: `${changes.length} campo(s) alterado(s)`, changes }
}

function getTargetLabel(log: AuditLog): string {
  const meta = log.metadata || {}
  const after = meta.after || {}
  const before = meta.before || {}
  const data = { ...before, ...after }

  if (log.entity_type === 'leads') {
    return data.contact || data.company || `Lead #${log.entity_id?.slice(0, 8)}`
  }
  if (log.entity_type === 'meetings') {
    return data.notes
      ? `Reunião: ${data.notes.slice(0, 30)}`
      : `Reunião #${log.entity_id?.slice(0, 8)}`
  }
  return `${ENTITY_LABELS[log.entity_type] || log.entity_type}: ${log.entity_id?.slice(0, 8) || '-'}`
}

export function AdminLogs() {
  const { users } = useDataStore()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const [filters, setFilters] = useState({
    userId: 'all',
    entityType: 'all',
    actionType: 'all',
    startDate: '',
    endDate: '',
  })

  const pageSize = 15
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const { logs: data, total: count } = await fetchAuditLogs({
        ...filters,
        page,
        pageSize,
      })
      setLogs(data)
      setTotal(count)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const setQuickRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setFilters((prev) => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }))
    setPage(1)
  }

  const hasActiveFilters = useMemo(() => {
    return (
      filters.userId !== 'all' ||
      filters.entityType !== 'all' ||
      filters.actionType !== 'all' ||
      filters.startDate !== '' ||
      filters.endDate !== ''
    )
  }, [filters])

  const clearFilters = () => {
    setFilters({
      userId: 'all',
      entityType: 'all',
      actionType: 'all',
      startDate: '',
      endDate: '',
    })
    setPage(1)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
          <ScrollText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Logs de Atividade
          </h1>
          <p className="text-muted-foreground text-sm">
            Auditoria completa de ações no sistema
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Select
            value={filters.userId}
            onValueChange={(v) => handleFilterChange('userId', v)}
          >
            <SelectTrigger className="w-[200px]">
              <User className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Usuários</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.entityType}
            onValueChange={(v) => handleFilterChange('entityType', v)}
          >
            <SelectTrigger className="w-[200px]">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="leads">Leads</SelectItem>
              <SelectItem value="meetings">Reuniões</SelectItem>
              <SelectItem value="opportunities">Oportunidades</SelectItem>
              <SelectItem value="customers">Clientes</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.actionType}
            onValueChange={(v) => handleFilterChange('actionType', v)}
          >
            <SelectTrigger className="w-[180px]">
              <Activity className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Ações</SelectItem>
              <SelectItem value="INSERT">Inclusões</SelectItem>
              <SelectItem value="UPDATE">Atualizações</SelectItem>
              <SelectItem value="DELETE">Exclusões</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 h-10 shadow-sm">
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="bg-transparent text-sm outline-none text-gray-700 font-medium cursor-pointer"
            />
            <span className="text-gray-400 text-sm">até</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="bg-transparent text-sm outline-none text-gray-700 font-medium cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(7)}
            >
              7 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(30)}
            >
              30 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(90)}
            >
              90 dias
            </Button>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500"
            >
              Limpar
            </Button>
          )}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm text-gray-500">Carregando logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Nenhum log encontrado
            </h3>
            <p className="text-gray-500 max-w-sm">
              Não há atividades registradas para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Alvo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {log.profile?.name || 'Sistema'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.profile?.email || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'border-0 font-medium',
                          ACTION_COLORS[log.action_type] ||
                            'bg-gray-100 text-gray-700',
                        )}
                      >
                        {ACTION_LABELS[log.action_type] || log.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-700">
                      {getTargetLabel(log)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-gray-50 text-gray-600 font-normal"
                      >
                        {ENTITY_LABELS[log.entity_type] || log.entity_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="text-indigo-600 hover:text-indigo-700 h-8 px-2"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
              <div className="text-sm text-gray-500">
                Mostrando{' '}
                <span className="font-medium">
                  {total === 0 ? 0 : (page - 1) * pageSize + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(page * pageSize, total)}
                </span>{' '}
                de <span className="font-medium">{total}</span> registros
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm font-medium text-gray-700 px-2">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileClock className="w-5 h-5 text-indigo-600" />
              Detalhes da Atividade
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Usuário
                  </span>
                  <span className="text-gray-900">
                    {selectedLog.profile?.name || 'Sistema'}
                  </span>
                  {selectedLog.profile?.email && (
                    <span className="text-xs text-gray-500 block">
                      {selectedLog.profile.email}
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Ação
                  </span>
                  <Badge
                    className={cn(
                      'border-0',
                      ACTION_COLORS[selectedLog.action_type] ||
                        'bg-gray-100 text-gray-700',
                    )}
                  >
                    {ACTION_LABELS[selectedLog.action_type] ||
                      selectedLog.action_type}
                  </Badge>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Categoria
                  </span>
                  <span className="text-gray-900">
                    {ENTITY_LABELS[selectedLog.entity_type] ||
                      selectedLog.entity_type}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Data/Hora
                  </span>
                  <span className="text-gray-900">
                    {format(
                      new Date(selectedLog.created_at),
                      'dd/MM/yyyy HH:mm:ss',
                    )}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {formatMetadata(selectedLog).label}
                </h4>
                <ScrollArea className="h-[300px] rounded-lg border border-gray-100">
                  <div className="p-4 space-y-2">
                    {formatMetadata(selectedLog).changes.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Nenhuma alteração detectada.
                      </p>
                    ) : (
                      formatMetadata(selectedLog).changes.map((change, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                            {change.field}
                          </span>
                          <div className="flex items-start gap-2 text-sm">
                            {selectedLog.action_type === 'INSERT' ? (
                              <span className="text-green-700">
                                <span className="font-medium">
                                  Definido como:
                                </span>{' '}
                                {formatValue(change.to)}
                              </span>
                            ) : selectedLog.action_type === 'DELETE' ? (
                              <span className="text-red-700">
                                <span className="font-medium">Removido:</span>{' '}
                                {formatValue(change.from)}
                              </span>
                            ) : (
                              <>
                                <span className="text-red-600 line-through">
                                  {formatValue(change.from)}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="text-green-700 font-medium">
                                  {formatValue(change.to)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return '(vazio)'
  if (typeof val === 'object') return JSON.stringify(val)
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
    try {
      return format(new Date(val), 'dd/MM/yyyy HH:mm')
    } catch {
      return val
    }
  }
  return String(val)
}
