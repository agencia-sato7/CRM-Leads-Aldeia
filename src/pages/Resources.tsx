import { useState } from 'react'
import {
  FileText,
  FileDown,
  Presentation,
  BookOpen,
  Trash2,
  Edit,
  Plus,
  AlertCircle,
  X,
  Link as LinkIcon,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDataStore } from '@/stores/use-data-store'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const iconMap: Record<string, any> = {
  Oficial: BookOpen,
  Comercial: FileText,
  Design: Presentation,
  Processos: BookOpen,
}

export default function Resources() {
  const {
    resources,
    currentUser,
    removeResource,
    addResource,
    fetchInitialData,
  } = useDataStore()

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tag: 'Comercial',
    url: '',
  })
  const [activeTab, setActiveTab] = useState('link')
  const [file, setFile] = useState<File | null>(null)

  const confirmDelete = (id: string) => {
    setResourceToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (resourceToDelete) {
      await removeResource(resourceToDelete)
      toast.success('Material removido com sucesso!')
      setIsDeleteModalOpen(false)
      setResourceToDelete(null)
    }
  }

  const openAddModal = () => {
    setEditingResource(null)
    setFormData({ title: '', description: '', tag: 'Comercial', url: '' })
    setActiveTab('link')
    setFile(null)
    setIsFormModalOpen(true)
  }

  const openEditModal = (resource: any) => {
    setEditingResource(resource)
    setFormData({
      title: resource.title || '',
      description: resource.desc || resource.description || '',
      tag: resource.tag || 'Comercial',
      url: resource.url || '',
    })
    setActiveTab('link')
    setFile(null)
    setIsFormModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) return toast.error('O título é obrigatório.')

    try {
      let finalUrl = formData.url

      if (activeTab === 'file' && file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('resources')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('resources')
          .getPublicUrl(fileName)

        finalUrl = publicUrlData.publicUrl
      } else if (activeTab === 'link' && !formData.url) {
        return toast.error('A URL é obrigatória.')
      } else if (activeTab === 'file' && !file && !editingResource) {
        return toast.error('Selecione um arquivo PDF.')
      }

      if (editingResource) {
        const { error } = await supabase
          .from('resources')
          .update({
            title: formData.title,
            description: formData.description,
            tag: formData.tag,
            url: finalUrl,
          })
          .eq('id', editingResource.id)

        if (error) throw error
        toast.success('Material atualizado com sucesso!')
        if (fetchInitialData) await fetchInitialData()
      } else {
        await addResource({
          title: formData.title,
          desc: formData.description,
          tag: formData.tag,
          url: finalUrl,
        })
        toast.success('Material adicionado com sucesso!')
      }
      setIsFormModalOpen(false)
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600 text-white rounded-xl shadow-sm shadow-red-200/50">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Repositório Comercial
            </h2>
            <p className="text-muted-foreground">
              Materiais de apoio, scripts e apresentações.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {currentUser?.role === 'ADMIN' && (
            <Button
              onClick={openAddModal}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" /> Novo Material
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {resources.map((item) => {
          const IconComponent = iconMap[item.tag] || FileText
          return (
            <div
              key={item.id}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <IconComponent className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                  {item.tag}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500 mb-6 flex-1">{item.desc}</p>
              <div className="flex gap-2 w-full mt-auto pt-4 border-t border-gray-50">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-gray-700 hover:text-red-600 hover:bg-red-50 border-gray-200"
                  asChild
                >
                  <a
                    href={item.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileDown className="w-4 h-4" /> Acessar
                  </a>
                </Button>

                {currentUser?.role === 'ADMIN' && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditModal(item)}
                      title="Editar Material"
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50 border-gray-200"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => confirmDelete(item.id)}
                      title="Excluir Material"
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50 border-gray-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 animate-slide-up">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Excluir Material?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Tem certeza que deseja excluir este material? Esta ação não
                poderá ser desfeita.
              </p>
              <div className="flex w-full gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                >
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingResource ? 'Editar Material' : 'Novo Material'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFormModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Título
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Script de Vendas..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Instruções breves..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tag</label>
                <select
                  value={formData.tag}
                  onChange={(e) =>
                    setFormData({ ...formData, tag: e.target.value })
                  }
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Comercial">Comercial</option>
                  <option value="Oficial">Oficial</option>
                  <option value="Design">Design</option>
                  <option value="Processos">Processos</option>
                </select>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full mt-4"
              >
                <TabsList className="w-full mb-4">
                  <TabsTrigger
                    value="link"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" /> URL / Link
                  </TabsTrigger>
                  <TabsTrigger
                    value="file"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Upload de PDF
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="link" className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    URL / Link
                  </label>
                  <Input
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </TabsContent>

                <TabsContent value="file" className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Arquivo PDF
                  </label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {editingResource && !file && formData.url && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Um link ou arquivo já está associado a este material. Faça
                      o upload para substituí-lo.
                    </p>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
