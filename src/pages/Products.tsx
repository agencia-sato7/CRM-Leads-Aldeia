import { useState, useMemo } from 'react'
import {
  PackageSearch,
  Plus,
  Search,
  Pencil,
  Trash2,
  Tags,
  Building2,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useDataStore, Product } from '@/stores/use-data-store'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Products() {
  const {
    products,
    brands,
    productCategories,
    addProduct,
    updateProduct,
    deleteProduct,
    addBrand,
    deleteBrand,
    addProductCategory,
    deleteProductCategory,
  } = useDataStore()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [filterBrand, setFilterBrand] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  const [productForm, setProductForm] = useState({
    name: '',
    brandId: '',
    categoryId: 'none',
    searchTerms: '',
  })

  const [brandName, setBrandName] = useState('')
  const [categoryName, setCategoryName] = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string
    type: 'product' | 'brand' | 'category'
  } | null>(null)

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.searchTerms.toLowerCase().includes(search.toLowerCase())
      const matchBrand = filterBrand === 'all' || p.brandId === filterBrand
      const matchCategory =
        filterCategory === 'all' || p.categoryId === filterCategory
      return matchSearch && matchBrand && matchCategory
    })
  }, [products, search, filterBrand, filterCategory])

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        brandId: product.brandId,
        categoryId: product.categoryId || 'none',
        searchTerms: product.searchTerms,
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        name: '',
        brandId: '',
        categoryId: 'none',
        searchTerms: '',
      })
    }
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.brandId) {
      toast({
        title: 'Aviso',
        description: 'Preencha os campos obrigatórios',
        variant: 'destructive',
      })
      return
    }
    try {
      const payload = {
        name: productForm.name,
        brandId: productForm.brandId,
        categoryId:
          productForm.categoryId === 'none'
            ? undefined
            : productForm.categoryId,
        searchTerms: productForm.searchTerms,
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload)
        toast({ title: 'Sucesso', description: 'Produto atualizado' })
      } else {
        await addProduct(payload)
        toast({ title: 'Sucesso', description: 'Produto cadastrado' })
      }
      setIsProductModalOpen(false)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleAddBrand = async () => {
    if (!brandName) return
    try {
      await addBrand({ name: brandName })
      setBrandName('')
      toast({ title: 'Sucesso', description: 'Marca cadastrada' })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleAddCategory = async () => {
    if (!categoryName) return
    try {
      await addProductCategory({ name: categoryName })
      setCategoryName('')
      toast({ title: 'Sucesso', description: 'Categoria cadastrada' })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      if (deleteConfirm.type === 'product') {
        await deleteProduct(deleteConfirm.id)
        toast({ title: 'Sucesso', description: 'Produto removido' })
      } else if (deleteConfirm.type === 'brand') {
        await deleteBrand(deleteConfirm.id)
        toast({
          title: 'Sucesso',
          description:
            'Marca removida. Produtos vinculados também foram apagados.',
        })
      } else if (deleteConfirm.type === 'category') {
        await deleteProductCategory(deleteConfirm.id)
        toast({
          title: 'Sucesso',
          description:
            'Categoria removida. Produtos vinculados ficaram sem categoria.',
        })
      }
      setDeleteConfirm(null)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <PackageSearch className="w-8 h-8 text-[#227b50]" />
            Catálogo de Produtos
          </h1>
          <p className="text-gray-500 mt-2">
            Gerencie categorias, marcas, produtos e seus termos de pesquisa
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsCategoryModalOpen(true)}
            className="border-[#227b50] text-[#227b50] hover:bg-[#227b50]/10"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Gerenciar Categorias
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsBrandModalOpen(true)}
            className="border-[#227b50] text-[#227b50] hover:bg-[#227b50]/10"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Gerenciar Marcas
          </Button>
          <Button
            onClick={() => handleOpenProductModal()}
            className="bg-[#227b50] hover:bg-[#1a5f3e] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos ou termos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-gray-50/50"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-[200px] bg-gray-50/50">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {productCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterBrand} onValueChange={setFilterBrand}>
            <SelectTrigger className="w-full md:w-[200px] bg-gray-50/50">
              <SelectValue placeholder="Filtrar por marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 sm:p-6 bg-gray-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((p) => {
              const brand = brands.find((b) => b.id === p.brandId)
              const category = productCategories.find(
                (c) => c.id === p.categoryId,
              )
              const terms = p.searchTerms
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col"
                >
                  <div className="p-4 pb-3 bg-gray-50/80 border-b border-gray-100 flex flex-row items-start justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-[#227b50] mb-1 uppercase tracking-wider flex flex-col gap-0.5">
                        <span>{brand?.name || 'Sem Marca'}</span>
                        {category && (
                          <span className="text-gray-500 font-medium">
                            {category.name}
                          </span>
                        )}
                      </div>
                      <h3
                        className="text-base font-semibold leading-tight text-gray-900 line-clamp-2"
                        title={p.name}
                      >
                        {p.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-[#227b50] bg-white shadow-sm border border-gray-200"
                        onClick={() => handleOpenProductModal(p)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-red-600 bg-white shadow-sm border border-gray-200"
                        onClick={() =>
                          setDeleteConfirm({ id: p.id, type: 'product' })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start gap-2 text-sm text-gray-600 flex-1">
                      <Tags className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                      <div className="flex flex-wrap gap-1.5">
                        {terms.length > 0 ? (
                          terms.map((t, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-200"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            Sem termos cadastrados
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <PackageSearch className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-500 max-w-sm">
                  Tente ajustar seus filtros de busca ou crie um novo produto.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Marca *</Label>
              <Select
                value={productForm.brandId}
                onValueChange={(v) =>
                  setProductForm({ ...productForm, brandId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={productForm.categoryId}
                onValueChange={(v) =>
                  setProductForm({ ...productForm, categoryId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Categoria</SelectItem>
                  {productCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do Produto *</Label>
              <Input
                placeholder="Ex: Pisos e revestimentos"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Termos de Busca (separados por vírgula)</Label>
              <textarea
                placeholder="Ex: Porcelanato, Piso de cimento, Revestimento..."
                value={productForm.searchTerms}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    searchTerms: e.target.value,
                  })
                }
                className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#227b50] disabled:cursor-not-allowed disabled:opacity-50 resize-none h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProductModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProduct}
              className="bg-[#227b50] hover:bg-[#1a5f3e] text-white"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da nova categoria"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button
                onClick={handleAddCategory}
                className="bg-[#227b50] hover:bg-[#1a5f3e] text-white"
              >
                Adicionar
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {productCategories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 transition-colors hover:bg-gray-100"
                >
                  <span className="font-medium text-gray-700">{c.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-white"
                    onClick={() =>
                      setDeleteConfirm({ id: c.id, type: 'category' })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {productCategories.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500 flex flex-col items-center">
                  <FolderOpen className="w-8 h-8 text-gray-300 mb-2" />
                  Nenhuma categoria cadastrada.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBrandModalOpen} onOpenChange={setIsBrandModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Marcas</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da nova marca"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBrand()}
              />
              <Button
                onClick={handleAddBrand}
                className="bg-[#227b50] hover:bg-[#1a5f3e] text-white"
              >
                Adicionar
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {brands.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 transition-colors hover:bg-gray-100"
                >
                  <span className="font-medium text-gray-700">{b.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-white"
                    onClick={() =>
                      setDeleteConfirm({ id: b.id, type: 'brand' })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {brands.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500 flex flex-col items-center">
                  <Building2 className="w-8 h-8 text-gray-300 mb-2" />
                  Nenhuma marca cadastrada.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBrandModalOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Atenção!</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-gray-600">
            {deleteConfirm?.type === 'brand'
              ? 'Ao excluir esta marca, TODOS os produtos associados a ela também serão permanentemente excluídos. Esta ação não pode ser desfeita.'
              : deleteConfirm?.type === 'category'
                ? 'Ao excluir esta categoria, os produtos associados a ela ficarão sem categoria. Esta ação não pode ser desfeita.'
                : 'Esta ação não pode ser desfeita. O produto será permanentemente excluído.'}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
