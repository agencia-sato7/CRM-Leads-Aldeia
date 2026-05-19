import { useState, Fragment, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useDataStore, Category, Service } from '@/stores/use-data-store'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function PriceTable() {
  const {
    currentUser,
    categories,
    services,
    addCategory,
    updateCategory,
    deleteCategory,
    addService,
    updateService,
    deleteService,
  } = useDataStore()

  const [isCatOpen, setIsCatOpen] = useState(false)
  const [catForm, setCatForm] = useState<Partial<Category>>({})

  const [isSvcOpen, setIsSvcOpen] = useState(false)
  const [svcForm, setSvcForm] = useState<Partial<Service>>({})

  const [perms, setPerms] = useState({
    can_create: false,
    can_update: false,
    can_delete: false,
  })

  useEffect(() => {
    async function fetchPerms() {
      if (!currentUser) return

      if (currentUser.role === 'ADMIN') {
        setPerms({ can_create: true, can_update: true, can_delete: true })
        return
      }

      if (currentUser.role?.toUpperCase() === 'COMMERCIAL') {
        setPerms({ can_create: false, can_update: false, can_delete: false })
        return
      }

      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .ilike('name', currentUser.role)
        .maybeSingle()

      if (roleData) {
        const { data: permData } = await supabase
          .from('role_permissions')
          .select('can_create, can_update, can_delete')
          .eq('role_id', roleData.id)
          .in('resource', ['price-table', 'price_table'])
          .limit(1)
          .maybeSingle()

        if (permData) {
          setPerms({
            can_create: !!permData.can_create,
            can_update: !!permData.can_update,
            can_delete: !!permData.can_delete,
          })
        }
      }
    }

    fetchPerms()
  }, [currentUser])

  const groupedServices = categories.map((category) => ({
    category,
    services: services.filter((s) => s.categoryId === category.id),
  }))

  const uncategorizedServices = services.filter((s) => !s.categoryId)
  if (uncategorizedServices.length > 0) {
    groupedServices.push({
      category: {
        id: 'uncategorized',
        name: 'Outros',
        description: 'Serviços sem categoria definida',
      },
      services: uncategorizedServices,
    })
  }

  const handleSaveCat = async () => {
    if (!catForm.name) return
    try {
      if (catForm.id) await updateCategory(catForm.id, catForm)
      else await addCategory(catForm as Omit<Category, 'id'>)
      toast.success('Categoria salva com sucesso!')
      setIsCatOpen(false)
    } catch {
      toast.error('Erro ao salvar categoria')
    }
  }

  const handleDeleteCat = async (id: string) => {
    if (!confirm('Deseja excluir esta categoria?')) return
    try {
      await deleteCategory(id)
      toast.success('Excluída com sucesso')
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const handleSaveSvc = async () => {
    if (!svcForm.name) return
    try {
      if (svcForm.id) await updateService(svcForm.id, svcForm)
      else await addService(svcForm as Omit<Service, 'id'>)
      toast.success('Serviço salvo com sucesso!')
      setIsSvcOpen(false)
    } catch {
      toast.error('Erro ao salvar serviço')
    }
  }

  const handleDeleteSvc = async (id: string) => {
    if (!confirm('Deseja excluir este serviço?')) return
    try {
      await deleteService(id)
      toast.success('Excluído com sucesso')
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in mt-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-red-600 rounded-full mb-4 shadow-inner">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Tabela de Preços SATO7
        </h1>
        <p className="text-muted-foreground mt-2">
          Catálogo oficial de serviços, categorizado por escopo e modelo de
          negócio para referência rápida.
        </p>
      </div>

      {perms.can_create && (
        <div className="flex justify-end gap-3 mb-4">
          <Button
            variant="outline"
            onClick={() => {
              setCatForm({ name: '', description: '' })
              setIsCatOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Categoria
          </Button>
          <Button
            onClick={() => {
              setSvcForm({
                name: '',
                baseValue: 0,
                ceilingValue: 0,
                categoryId: '',
              })
              setIsSvcOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Serviço
          </Button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[280px]">Modelo / Categoria</TableHead>
              <TableHead>Serviço Específico</TableHead>
              <TableHead className="text-right">Valor Mínimo Base</TableHead>
              <TableHead className="text-right">Teto Padrão / Médio</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedServices.map(({ category, services }) => (
              <Fragment key={category.id}>
                {services.length === 0 ? (
                  <TableRow className="hover:bg-gray-50/80 transition-colors">
                    <TableCell className="font-bold text-gray-900 align-top pt-4 bg-gray-50/30 border-r border-gray-100">
                      <div className="flex flex-col gap-1">
                        <span className="uppercase text-sm tracking-wider">
                          {category.name}
                        </span>
                        {category.description && (
                          <span className="text-xs text-gray-500 font-normal normal-case">
                            {category.description}
                          </span>
                        )}
                        {category.id !== 'uncategorized' && (
                          <div className="flex items-center gap-1 mt-2">
                            {perms.can_update && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setCatForm({ ...category })
                                  setIsCatOpen(true)
                                }}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            )}
                            {perms.can_delete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500"
                                onClick={() => handleDeleteCat(category.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                            {perms.can_create && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs ml-1"
                                onClick={() => {
                                  setSvcForm({
                                    name: '',
                                    baseValue: 0,
                                    ceilingValue: 0,
                                    categoryId: category.id,
                                  })
                                  setIsSvcOpen(true)
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Serviço
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      colSpan={4}
                      className="text-gray-400 py-4 text-center"
                    >
                      Nenhum serviço cadastrado nesta categoria.
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((s, idx) => (
                    <TableRow
                      key={s.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      {idx === 0 && (
                        <TableCell
                          rowSpan={services.length}
                          className="font-bold text-gray-900 align-top pt-4 bg-gray-50/30 border-r border-gray-100"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="uppercase text-sm tracking-wider">
                              {category.name}
                            </span>
                            {category.description && (
                              <span className="text-xs text-gray-500 font-normal normal-case">
                                {category.description}
                              </span>
                            )}
                            {category.id !== 'uncategorized' && (
                              <div className="flex items-center gap-1 mt-2">
                                {perms.can_update && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setCatForm({ ...category })
                                      setIsCatOpen(true)
                                    }}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                )}
                                {perms.can_delete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-500"
                                    onClick={() => handleDeleteCat(category.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                                {perms.can_create && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs ml-1"
                                    onClick={() => {
                                      setSvcForm({
                                        name: '',
                                        baseValue: 0,
                                        ceilingValue: 0,
                                        categoryId: category.id,
                                      })
                                      setIsSvcOpen(true)
                                    }}
                                  >
                                    <Plus className="w-3 h-3 mr-1" /> Serviço
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-gray-700 font-medium py-4">
                        {s.name}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900 py-4">
                        {s.baseValue === 0
                          ? 'Sob Consulta'
                          : new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(s.baseValue)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-500 py-4">
                        {s.ceilingValue === 0 || s.ceilingValue >= 100000
                          ? 'R$ ∞'
                          : new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(s.ceilingValue)}
                      </TableCell>
                      <TableCell className="text-right py-4 space-x-1">
                        {perms.can_update && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSvcForm({ ...s })
                              setIsSvcOpen(true)
                            }}
                          >
                            <Pencil className="w-4 h-4 text-gray-500" />
                          </Button>
                        )}
                        {perms.can_delete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => handleDeleteSvc(s.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </Fragment>
            ))}
            {groupedServices.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-500"
                >
                  Nenhum serviço cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCatOpen} onOpenChange={setIsCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {catForm.id ? 'Editar' : 'Nova'} Categoria
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={catForm.name || ''}
                onChange={(e) =>
                  setCatForm({ ...catForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={catForm.description || ''}
                onChange={(e) =>
                  setCatForm({ ...catForm, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCatOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCat}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSvcOpen} onOpenChange={setIsSvcOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{svcForm.id ? 'Editar' : 'Novo'} Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Serviço</Label>
              <Input
                value={svcForm.name || ''}
                onChange={(e) =>
                  setSvcForm({ ...svcForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={svcForm.categoryId || 'uncategorized'}
                onValueChange={(v) =>
                  setSvcForm({
                    ...svcForm,
                    categoryId: v === 'uncategorized' ? undefined : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">Sem categoria</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Base (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={svcForm.baseValue || ''}
                  onChange={(e) =>
                    setSvcForm({
                      ...svcForm,
                      baseValue: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Teto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={svcForm.ceilingValue || ''}
                  onChange={(e) =>
                    setSvcForm({
                      ...svcForm,
                      ceilingValue: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSvcOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSvc}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
