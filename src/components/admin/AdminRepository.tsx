import { useState } from 'react'
import {
  FileText,
  Link as LinkIcon,
  Trash2,
  Upload,
  Plus,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { useDataStore } from '@/stores/use-data-store'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function AdminRepository() {
  const { resources, addResource, removeResource } = useDataStore()

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState('link')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return toast.error('O título é obrigatório.')

    if (activeTab === 'link' && !url) {
      return toast.error('A URL é obrigatória.')
    }
    if (activeTab === 'file' && !file) {
      return toast.error('Selecione um arquivo.')
    }

    let finalUrl = url
    if (activeTab === 'file' && file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('resources')
        .upload(fileName, file)

      if (error) {
        return toast.error('Erro ao fazer upload: ' + error.message)
      }

      const { data: publicUrlData } = supabase.storage
        .from('resources')
        .getPublicUrl(fileName)

      finalUrl = publicUrlData.publicUrl
    }

    await addResource({
      title,
      desc,
      tag: activeTab === 'file' ? 'Oficial' : 'Comercial',
      url: finalUrl,
    })

    toast.success('Material adicionado com sucesso!')
    setTitle('')
    setDesc('')
    setUrl('')
    setFile(null)
  }

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null)

  const confirmDelete = (id: string) => {
    setResourceToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (resourceToDelete) {
      await removeResource(resourceToDelete)
      toast.success('Material removido!')
      setIsDeleteModalOpen(false)
      setResourceToDelete(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            Adicionar Novo Material
          </h2>
          <p className="text-sm text-gray-500">
            Faça upload de arquivos ou adicione links externos para a equipe
            comercial.
          </p>
        </div>

        <form onSubmit={handleAdd} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium leading-none"
              >
                Título do Material
              </label>
              <Input
                id="title"
                placeholder="Ex: Script de Vendas..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="desc"
                className="text-sm font-medium leading-none"
              >
                Descrição (Opcional)
              </label>
              <Input
                id="desc"
                placeholder="Instruções breves..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="link" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> Link Externo
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload de Arquivo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="url"
                  className="text-sm font-medium leading-none"
                >
                  URL do Link
                </label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required={activeTab === 'link'}
                />
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="file"
                  className="text-sm font-medium leading-none"
                >
                  Arquivo (.pdf, .doc, .xls...)
                </label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required={activeTab === 'file'}
                  className="cursor-pointer"
                />
              </div>
            </TabsContent>
          </Tabs>

          <Button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar ao Repositório
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Materiais Disponíveis
          </h2>
          <p className="text-sm text-gray-500">
            Gerencie os materiais atualmente disponíveis para a equipe
            comercial.
          </p>
        </div>
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground h-24"
                >
                  Nenhum material cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              resources.map((res) => (
                <TableRow key={res.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-500" />
                      {res.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {res.desc || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {res.url && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => confirmDelete(res.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
    </div>
  )
}
