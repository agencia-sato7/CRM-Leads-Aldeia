import { cn } from '@/lib/utils'
import {
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Lightbulb,
} from 'lucide-react'
import logo from '@/assets/logo-dtosb2yn-68c37.png'

export function DocSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-12 py-10 border-b border-gray-100 last:border-0"
    >
      <h2 className="text-2xl font-bold text-[#155237] mb-6 flex items-center gap-3">
        <div className="w-1.5 h-7 bg-[#2d9066] rounded-full"></div>
        {title}
      </h2>
      <div className="space-y-6 text-gray-700 leading-relaxed">{children}</div>
    </section>
  )
}

export function Callout({
  type,
  title,
  children,
}: {
  type: 'info' | 'warning' | 'danger' | 'success' | 'tip'
  title?: string
  children: React.ReactNode
}) {
  const styles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-500',
      text: 'text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-500',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-500',
    },
    tip: {
      bg: 'bg-purple-50',
      border: 'border-purple-500',
      text: 'text-purple-800',
      icon: Lightbulb,
      iconColor: 'text-purple-500',
    },
  }

  const style = styles[type]
  const Icon = style.icon

  return (
    <div
      className={cn(
        'p-4 rounded-r-lg border-l-4 my-6 flex gap-3',
        style.bg,
        style.border,
        style.text,
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', style.iconColor)} />
      <div>
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Novo: 'bg-blue-100 text-blue-700 border-blue-200',
    Qualificado: 'bg-purple-100 text-purple-700 border-purple-200',
    'Em Negociação': 'bg-amber-100 text-amber-700 border-amber-200',
    Ganho: 'bg-green-100 text-green-700 border-green-200',
    Perdido: 'bg-red-100 text-red-700 border-red-200',
    Desinteressado: 'bg-gray-100 text-gray-700 border-gray-200',
    'Não qualificado': 'bg-rose-100 text-rose-700 border-rose-200',
  }

  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-medium border',
        styles[status] || 'bg-gray-100 text-gray-700',
      )}
    >
      {status}
    </span>
  )
}

export function DocsHeader() {
  return (
    <div className="text-center mb-12 pt-8">
      <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <img src={logo} alt="Aldeia Acabamentos" className="h-12 w-auto" />
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-[#155237] tracking-tight mb-4">
        Manual de Uso — CRM Aldeia Acabamentos
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Guia completo para utilização da plataforma de relacionamento com
        clientes, gestão de leads e acompanhamento de oportunidades de negócio.
      </p>
    </div>
  )
}

export function DocsTOC() {
  const links = [
    { id: 'acesso', title: '1. Acesso ao Sistema' },
    { id: 'dashboard', title: '2. Painel de Indicadores' },
    { id: 'leads', title: '3. Gestão de Leads' },
    { id: 'pipeline', title: '4. Fluxo de Etapas' },
    { id: 'oportunidades', title: '5. Oportunidades & Negociações' },
    { id: 'clientes', title: '6. Carteira de Clientes' },
    { id: 'agenda', title: '7. Agenda e Reuniões' },
    { id: 'onboarding', title: '8. Ficha de Onboarding' },
    { id: 'produtos', title: '9. Catálogo de Produtos' },
    { id: 'materiais', title: '10. Materiais de Apoio' },
    { id: 'equipe', title: '11. Gestão da Equipe' },
    { id: 'conta', title: '12. Configurações da Conta' },
  ]

  return (
    <div className="bg-[#e8f5ee] rounded-xl p-6 sm:p-8 border border-[#2d9066]/20">
      <h3 className="text-xl font-bold text-[#155237] mb-6">
        O que você encontra neste manual
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="flex items-center gap-2 text-[#1a6b4a] hover:text-[#2d9066] hover:underline font-medium transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d9066] flex-shrink-0" />
            <span className="truncate">{link.title}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
