import { DocSection, Callout } from './DocsShared'
import { Shield, Users } from 'lucide-react'

export function SectionMeetings() {
  return (
    <DocSection id="agenda" title="7. Agenda e Histórico de Reuniões">
      <p>
        Use este módulo para registrar os compromissos agendados e manter um
        histórico preciso das conversas com cada lead.
      </p>
      <Callout type="info" title="Boas Práticas">
        Adicione anotações (atas) de cada reunião realizada. Isso facilita a
        retomada de contexto em negociações longas e ajuda no acompanhamento por
        outros membros da equipe.
      </Callout>
    </DocSection>
  )
}

export function SectionOnboarding() {
  return (
    <DocSection id="onboarding" title="8. Ficha de Onboarding">
      <p>
        Quando uma venda é concluída (Ganha), o preenchimento da ficha de
        onboarding é o próximo passo fundamental para iniciar o serviço.
      </p>
      <ul className="list-disc pl-5 mt-4 space-y-2">
        <li>
          Reúne detalhes técnicos do projeto, contexto de marketing e links
          essenciais (site, redes sociais).
        </li>
        <li>
          Garante que a equipe de execução receba o cliente com todas as
          informações alinhadas na venda.
        </li>
      </ul>
      <Callout type="danger" title="Atenção">
        A ficha de onboarding é obrigatória para o repasse oficial do cliente
        para a equipe de pós-venda/operações. Sem ela, o serviço não é iniciado.
      </Callout>
    </DocSection>
  )
}

export function SectionProducts() {
  return (
    <DocSection id="produtos" title="9. Catálogo de Produtos e Serviços">
      <p>
        Mantém a lista padronizada dos serviços e produtos ofertados,
        facilitando a vinculação nos leads e oportunidades.
      </p>
      <p className="mt-4">
        Cada produto deve estar categorizado corretamente. A manutenção do
        catálogo é, geralmente, uma atribuição exclusiva dos Administradores do
        sistema.
      </p>
    </DocSection>
  )
}

export function SectionMaterials() {
  return (
    <DocSection id="materiais" title="10. Materiais de Apoio">
      <p>
        A seção de materiais de apoio funciona como um repositório interno de
        links, PDFs e documentos importantes para o time de vendas.
      </p>
      <ul className="list-disc pl-5 mt-4 space-y-2">
        <li>Apresentações institucionais.</li>
        <li>Tabelas de preços e propostas padrão.</li>
        <li>Manuais técnicos de produtos.</li>
      </ul>
    </DocSection>
  )
}

export function SectionTeam() {
  return (
    <DocSection id="equipe" title="11. Gestão da Equipe & Permissões">
      <p>
        O sistema possui um controle rigoroso de acesso baseado em perfis
        (Roles). Cada perfil determina a visibilidade e as ações permitidas.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 mb-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield className="w-24 h-24 text-[#155237]" />
          </div>
          <h4 className="text-lg font-bold text-[#155237] mb-3 relative z-10 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Perfil ADMIN
          </h4>
          <ul className="text-sm text-gray-600 space-y-2 relative z-10">
            <li>• Visão global de todos os leads de todos os usuários.</li>
            <li>• Gestão de usuários e permissões do sistema.</li>
            <li>• Edição de catálogos e configurações gerais.</li>
            <li>• Permissão para exclusão de registros.</li>
          </ul>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-24 h-24 text-[#2d9066]" />
          </div>
          <h4 className="text-lg font-bold text-[#2d9066] mb-3 relative z-10 flex items-center gap-2">
            <Users className="w-5 h-5" /> Perfil COMMERCIAL
          </h4>
          <ul className="text-sm text-gray-600 space-y-2 relative z-10">
            <li>• Visão restrita aos seus próprios leads atribuídos.</li>
            <li>• Gestão de suas oportunidades e agenda.</li>
            <li>• Preenchimento de fichas de onboardings.</li>
            <li>• Acesso total aos materiais de apoio e recursos.</li>
          </ul>
        </div>
      </div>
      <Callout type="warning">
        Alterações de perfil ou transferência de titularidade de leads só podem
        ser realizadas por um usuário com nível de Administração (ADMIN).
      </Callout>
    </DocSection>
  )
}

export function SectionAccount() {
  return (
    <DocSection id="conta" title="12. Configurações da Conta">
      <p>Gerencie as preferências pessoais do seu usuário no sistema.</p>
      <ul className="list-disc pl-5 mt-4 space-y-2">
        <li>
          <strong>Perfil:</strong> Atualização de nome, telefone e foto
          (avatar).
        </li>
        <li>
          <strong>Segurança:</strong> Alteração de senha e configuração de
          autenticação.
        </li>
      </ul>
    </DocSection>
  )
}
