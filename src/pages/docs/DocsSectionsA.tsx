import { DocSection, Callout, StatusBadge } from './DocsShared'

export function SectionAccess() {
  return (
    <DocSection id="acesso" title="1. Acesso ao Sistema">
      <p>
        O acesso ao CRM é restrito a colaboradores autorizados da Aldeia
        Acabamentos.
      </p>
      <h3 className="text-lg font-semibold text-[#1a6b4a] mt-6 mb-3">
        Login e Recuperação
      </h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          Acesse a página inicial de login inserindo seu e-mail e senha
          cadastrados.
        </li>
        <li>
          Em caso de esquecimento da senha, utilize o link{' '}
          <strong>"Esqueci minha senha"</strong> para receber um e-mail de
          recuperação.
        </li>
      </ul>
      <Callout type="warning" title="Segurança da Conta">
        Não compartilhe suas credenciais com terceiros. A responsabilidade pelas
        ações realizadas no sistema é vinculada ao seu usuário.
      </Callout>
    </DocSection>
  )
}

export function SectionDashboard() {
  return (
    <DocSection id="dashboard" title="2. Painel de Indicadores (Dashboard)">
      <p>
        O Dashboard é a tela principal do sistema, oferecendo uma visão geral do
        seu desempenho e o panorama de vendas atual.
      </p>
      <div className="overflow-x-auto mt-6">
        <table className="w-full text-left border-collapse border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="py-3 px-4 font-semibold border-b">Indicador</th>
              <th className="py-3 px-4 font-semibold border-b">Descrição</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 font-medium text-gray-900">
                Novos Leads
              </td>
              <td className="py-3 px-4 text-gray-600">
                Quantidade de leads não contatados.
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 font-medium text-gray-900">
                Oportunidades em Aberto
              </td>
              <td className="py-3 px-4 text-gray-600">
                Negociações ativas que ainda não foram concluídas.
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 font-medium text-gray-900">
                Taxa de Conversão
              </td>
              <td className="py-3 px-4 text-gray-600">
                Percentual de leads que se tornaram clientes (ganhos).
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DocSection>
  )
}

export function SectionLeads() {
  return (
    <DocSection id="leads" title="3. Gestão de Leads">
      <p>
        O módulo de leads permite visualizar, cadastrar e acompanhar potenciais
        clientes.
      </p>
      <div className="my-6">
        <h3 className="text-lg font-semibold text-[#1a6b4a] mb-3">
          Status de Leads
        </h3>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="Novo" />
          <StatusBadge status="Qualificado" />
          <StatusBadge status="Em Negociação" />
          <StatusBadge status="Ganho" />
          <StatusBadge status="Perdido" />
          <StatusBadge status="Desinteressado" />
          <StatusBadge status="Não qualificado" />
        </div>
      </div>
      <Callout type="tip" title="Agilidade no Contato">
        Leads marcados como <StatusBadge status="Novo" /> devem ser contatados
        preferencialmente nas primeiras 24 horas para aumentar as chances de
        qualificação.
      </Callout>
    </DocSection>
  )
}

export function SectionPipeline() {
  return (
    <DocSection id="pipeline" title="4. Fluxo de Etapas (Pipeline)">
      <p>
        O pipeline reflete a jornada do cliente desde a captação até o
        fechamento da venda.
      </p>
      <div className="my-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
        <h4 className="font-semibold text-center mb-6 text-[#155237]">
          Resumo: fluxo completo
        </h4>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm font-medium">
          <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 shadow-sm w-full md:w-auto text-center">
            1. Captação (Novo)
          </div>
          <div className="text-gray-400 rotate-90 md:rotate-0">➔</div>
          <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 shadow-sm w-full md:w-auto text-center">
            2. Qualificação
          </div>
          <div className="text-gray-400 rotate-90 md:rotate-0">➔</div>
          <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 shadow-sm w-full md:w-auto text-center">
            3. Negociação
          </div>
          <div className="text-gray-400 rotate-90 md:rotate-0">➔</div>
          <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 shadow-sm w-full md:w-auto text-center">
            4. Fechamento (Ganho)
          </div>
        </div>
      </div>
      <Callout type="info">
        Ao mover um lead para a etapa de Negociação, uma{' '}
        <strong>Oportunidade</strong> correspondente é criada automaticamente no
        sistema.
      </Callout>
    </DocSection>
  )
}

export function SectionOpportunities() {
  return (
    <DocSection id="oportunidades" title="5. Oportunidades & Negociações">
      <p>
        As oportunidades são propostas comerciais ativas com valores e serviços
        definidos. Aqui você acompanha a saúde financeira do seu pipeline.
      </p>
      <ul className="list-disc pl-5 mt-4 space-y-2">
        <li>
          <strong>Valor Estimado:</strong> Sempre mantenha o valor e quantidade
          do serviço atualizados para previsibilidade de receita.
        </li>
        <li>
          <strong>Status da Oportunidade:</strong> Aberta, Ganha ou Perdida.
        </li>
      </ul>
      <Callout type="success" title="Conversão">
        Ao marcar uma oportunidade como "Ganha", o lead correspondente é
        promovido a <strong>Cliente</strong> automaticamente e migra para a
        etapa "Ganho" no pipeline.
      </Callout>
    </DocSection>
  )
}

export function SectionCustomers() {
  return (
    <DocSection id="clientes" title="6. Carteira de Clientes">
      <p>
        A Carteira de Clientes consolida todos os contatos que já realizaram
        negócio com a Aldeia Acabamentos.
      </p>
      <p className="mt-4">
        Ao acessar um cliente, você pode visualizar todo o histórico de
        interações, informações da empresa, CNPJ e detalhes de contato.
        Administradores têm visão completa de toda a carteira da empresa.
      </p>
    </DocSection>
  )
}
