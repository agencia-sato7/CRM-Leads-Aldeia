import { DocsHeader, DocsTOC } from './docs/DocsShared'
import {
  SectionAccess,
  SectionDashboard,
  SectionLeads,
  SectionPipeline,
  SectionOpportunities,
  SectionCustomers,
} from './docs/DocsSectionsA'
import {
  SectionMeetings,
  SectionOnboarding,
  SectionProducts,
  SectionMaterials,
  SectionTeam,
  SectionAccount,
} from './docs/DocsSectionsB'

export default function Docs() {
  return (
    <div className="min-h-screen bg-gray-50/50 font-sans selection:bg-[#2d9066] selection:text-white pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <DocsHeader />
        <DocsTOC />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-10 mt-8">
          <SectionAccess />
          <SectionDashboard />
          <SectionLeads />
          <SectionPipeline />
          <SectionOpportunities />
          <SectionCustomers />
          <SectionMeetings />
          <SectionOnboarding />
          <SectionProducts />
          <SectionMaterials />
          <SectionTeam />
          <SectionAccount />
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>
            <a
              href="https://crm.aldeiaacabamentos.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1a6b4a] hover:underline font-medium"
            >
              crm.aldeiaacabamentos.com.br
            </a>
          </p>
          <p className="mt-1">Junho de 2026</p>
        </footer>
      </div>
    </div>
  )
}
