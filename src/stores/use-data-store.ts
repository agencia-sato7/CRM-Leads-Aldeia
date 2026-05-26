import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export type Role = 'ADMIN' | 'COMMERCIAL'
export type User = {
  id: string
  name: string
  role: Role
  email: string
  password?: string
  isLocked?: boolean
  phone?: string
}
export type LeadStatus =
  | 'Novo'
  | 'Qualificado'
  | 'Em Negociação'
  | 'Ganho'
  | 'Perdido'
export type Country = 'Brazil' | 'USA'
export type LeadOrigin =
  | 'Site'
  | 'Google'
  | 'Instagram'
  | 'Facebook'
  | 'TikTok'
  | 'Indicação'
  | 'Manual'

export interface Meeting {
  id: string
  date: string
  notes: string
}

export interface Lead {
  id: string
  contact: string
  company: string
  email: string
  phone: string
  status: LeadStatus
  country: Country
  city: string
  origin: LeadOrigin
  marketingStatus: string
  objectives: string
  notes: string
  userId: string
  createdAt: string
  meetings: Meeting[]
  scheduledMeetingDate?: string
  quantity: number
  product_id?: string
  estimatedValue?: number
  cnpj?: string
  website?: string
  instagram?: string
  facebook?: string
  responded?: boolean
}

export interface Message {
  id: string
  fromId: string
  toId: string
  text: string
  fileUrl?: string
  createdAt: string
  read: boolean
}

export type OppType = 'Fee Mensal' | 'Job'
export type OppStatus = 'Aguardando' | 'Aberta' | 'Ganha' | 'Perdida'

export interface Opportunity {
  id: string
  leadId: string
  type: OppType
  service: string
  value: number
  status: OppStatus
  userId: string
  createdAt: string
  updatedAt: string
  quantity: number
  closedDate?: string
  amountPaid?: number
}

export interface Category {
  id: string
  name: string
  description?: string
}

export interface Service {
  id: string
  name: string
  categoryId?: string
  baseValue: number
  ceilingValue: number
}

export interface OnboardingData {
  id: string
  opportunityId: string
  userId: string
  companyName: string
  cnpj: string
  phone: string
  email: string
  site: string
  instagram: string
  facebook: string
  serviceDescription: string
  marketingContext: string
  createdAt: string
}

export interface Customer {
  id: string
  leadId?: string
  userId: string
  name: string
  company: string
  email?: string
  phone?: string
  cnpj?: string
  createdAt: string
}

export interface Resource {
  id: string
  title: string
  desc: string
  tag: string
  url?: string
}

export interface Brand {
  id: string
  name: string
  createdAt: string
}

export interface ProductCategory {
  id: string
  name: string
  createdAt: string
}

export interface Product {
  id: string
  brandId: string
  categoryId?: string
  name: string
  searchTerms: string
  price: number
  createdAt: string
}

interface DataStore {
  users: User[]
  currentUser: User | null
  leads: Lead[]
  opportunities: Opportunity[]
  resources: Resource[]
  messages: Message[]
  categories: Category[]
  services: Service[]
  customers: Customer[]
  onboardings: OnboardingData[]
  brands: Brand[]
  productCategories: ProductCategory[]
  products: Product[]

  fetchInitialData: () => Promise<void>
  updateUser: (id: string, data: Partial<User>) => Promise<void>
  addLead: (
    lead: Omit<Lead, 'id' | 'createdAt' | 'meetings'>,
  ) => Promise<string>
  updateLead: (id: string, data: Partial<Lead>) => Promise<void>
  addOpportunity: (
    opp: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<string>
  updateOpportunityStatus: (id: string, status: OppStatus) => Promise<void>
  updateOpportunity: (id: string, data: Partial<Opportunity>) => Promise<void>
  addResource: (res: Omit<Resource, 'id'>) => Promise<void>
  removeResource: (id: string) => Promise<void>
  addMessage: (msg: Omit<Message, 'id' | 'createdAt' | 'read'>) => Promise<void>
  markMessageRead: (id: string) => Promise<void>
  addCustomer: (cust: Omit<Customer, 'id' | 'createdAt'>) => Promise<string>
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  addOnboarding: (
    data: Omit<OnboardingData, 'id' | 'createdAt' | 'userId'>,
  ) => Promise<string>

  addCategory: (cat: Omit<Category, 'id'>) => Promise<string>
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  addService: (svc: Omit<Service, 'id'>) => Promise<string>
  updateService: (id: string, data: Partial<Service>) => Promise<void>
  deleteService: (id: string) => Promise<void>

  addBrand: (brand: Omit<Brand, 'id' | 'createdAt'>) => Promise<string>
  updateBrand: (id: string, data: Partial<Brand>) => Promise<void>
  deleteBrand: (id: string) => Promise<void>

  addProductCategory: (
    cat: Omit<ProductCategory, 'id' | 'createdAt'>,
  ) => Promise<string>
  deleteProductCategory: (id: string) => Promise<void>

  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<string>
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
}

export const useDataStore = create<DataStore>((set, get) => ({
  users: [],
  currentUser: null,
  leads: [],
  opportunities: [],
  messages: [],
  resources: [],
  categories: [],
  services: [],
  customers: [],
  onboardings: [],
  brands: [],
  productCategories: [],
  products: [],

  fetchInitialData: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) return

      const responses = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('opportunities')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('meetings')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true }),
        supabase
          .from('services')
          .select('*')
          .order('name', { ascending: true }),
        supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('onboardings')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('brands').select('*').order('name', { ascending: true }),
        supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true }),
        supabase
          .from('product_categories')
          .select('*')
          .order('name', { ascending: true }),
      ])

      const profiles = responses[0]?.data || []
      const leadsData = responses[1]?.data || []
      const oppsData = responses[2]?.data || []
      const resourcesData = responses[3]?.data || []
      const messagesData = responses[4]?.data || []
      const meetingsData = responses[5]?.data || []
      const categoriesData = responses[6]?.data || []
      const servicesData = responses[7]?.data || []
      const customersData = responses[8]?.data || []
      const onboardingsData = responses[9]?.data || []
      const brandsData = responses[10]?.data || []
      const productsData = responses[11]?.data || []
      const productCategoriesData = responses[12]?.data || []

      const mappedUsers: User[] = (profiles || []).map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role as Role,
        phone: p.phone || undefined,
        isLocked: p.is_locked || false,
      }))

      const currentUser =
        mappedUsers.find((u) => u.id === session.user.id) || null

      const mappedLeads: Lead[] = (leadsData || []).map((lead) => ({
        id: lead.id,
        userId: lead.user_id,
        contact: lead.contact,
        company: lead.company,
        email: lead.email || '',
        phone: lead.phone || '',
        status: lead.status as LeadStatus,
        country: lead.country as Country,
        city: lead.city || '',
        origin: lead.origin as LeadOrigin,
        marketingStatus: lead.marketing_status || '',
        objectives: lead.objectives || '',
        notes: lead.notes || '',
        scheduledMeetingDate: lead.scheduled_meeting_date || undefined,
        quantity: Number((lead as any).quantity) || 1,
        responded: (lead as any).responded || false,
        product_id: (lead as any).product_id || undefined,
        estimatedValue: (lead as any).estimated_value
          ? Number((lead as any).estimated_value)
          : undefined,
        cnpj: (lead as any).cnpj || '',
        website: (lead as any).website || '',
        instagram: (lead as any).instagram || '',
        facebook: (lead as any).facebook || '',
        createdAt: lead.created_at,
        meetings: (meetingsData || [])
          .filter((m) => m.lead_id === lead.id)
          .map((m) => ({
            id: m.id,
            date: m.date,
            notes: m.notes || '',
          })),
      }))

      const mappedOpps: Opportunity[] = (oppsData || []).map((opp) => ({
        id: opp.id,
        leadId: opp.lead_id,
        userId: opp.user_id,
        type: opp.type as OppType,
        service: opp.service,
        value: Number(opp.value),
        status: opp.status as OppStatus,
        createdAt: opp.created_at,
        updatedAt: opp.updated_at,
        quantity: Number((opp as any).quantity || 1),
        closedDate: (opp as any).closed_date || undefined,
        amountPaid: Number((opp as any).amount_paid) || 0,
      }))

      const mappedMessages: Message[] = (messagesData || []).map((msg) => ({
        id: msg.id,
        fromId: msg.from_id,
        toId: msg.to_id,
        text: msg.text,
        fileUrl: msg.file_url || undefined,
        read: msg.read || false,
        createdAt: msg.created_at,
      }))

      const mappedResources: Resource[] = (resourcesData || []).map((res) => ({
        id: res.id,
        title: res.title,
        desc: res.description || '',
        tag: res.tag,
        url: res.url || undefined,
      }))

      const mappedCategories: Category[] = (categoriesData || []).map(
        (cat) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || undefined,
        }),
      )

      const mappedServices: Service[] = (servicesData || []).map((svc) => ({
        id: svc.id,
        name: svc.name,
        categoryId: svc.category_id || undefined,
        baseValue: Number(svc.base_value),
        ceilingValue: Number(svc.ceiling_value),
      }))

      const mappedCustomers: Customer[] = (customersData || []).map((c) => ({
        id: c.id,
        leadId: c.lead_id || undefined,
        userId: c.user_id || '',
        name: c.name,
        company: c.company,
        email: c.email || '',
        phone: c.phone || '',
        cnpj: c.cnpj || '',
        createdAt: c.created_at,
      }))

      const mappedOnboardings: OnboardingData[] = (onboardingsData || []).map(
        (o) => ({
          id: o.id,
          opportunityId: o.opportunity_id,
          userId: o.user_id,
          companyName: o.company_name,
          cnpj: o.cnpj || '',
          phone: o.phone || '',
          email: o.email || '',
          site: o.site || '',
          instagram: o.instagram || '',
          facebook: o.facebook || '',
          serviceDescription: o.service_description || '',
          marketingContext: o.marketing_context || '',
          createdAt: o.created_at,
        }),
      )

      const mappedBrands: Brand[] = (brandsData || []).map((b) => ({
        id: b.id,
        name: b.name,
        createdAt: b.created_at,
      }))

      const mappedProductCategories: ProductCategory[] = (
        productCategoriesData || []
      ).map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.created_at,
      }))

      const mappedProducts: Product[] = (productsData || []).map((p) => ({
        id: p.id,
        brandId: p.brand_id || '',
        categoryId: p.category_id || undefined,
        name: p.name,
        searchTerms: p.search_terms || '',
        price: Number(p.price || 0),
        createdAt: p.created_at,
      }))

      set({
        users: mappedUsers,
        currentUser,
        leads: mappedLeads,
        opportunities: mappedOpps,
        resources: mappedResources,
        messages: mappedMessages,
        categories: mappedCategories,
        services: mappedServices,
        customers: mappedCustomers,
        onboardings: mappedOnboardings,
        brands: mappedBrands,
        productCategories: mappedProductCategories,
        products: mappedProducts,
      })
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    }
  },

  updateUser: async (id, data) => {
    const updatePayload: any = {}
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.phone !== undefined) updatePayload.phone = data.phone

    if (Object.keys(updatePayload).length > 0) {
      await supabase.from('profiles').update(updatePayload).eq('id', id)
    }

    if (data.password) {
      await supabase.auth.updateUser({ password: data.password })
    }

    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
      currentUser:
        state.currentUser?.id === id
          ? { ...state.currentUser, ...data }
          : state.currentUser,
    }))
  },

  addLead: async (lead) => {
    const dbLead = {
      user_id: lead.userId,
      contact: lead.contact,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      country: lead.country,
      city: lead.city,
      origin: lead.origin,
      marketing_status: lead.marketingStatus,
      objectives: lead.objectives,
      notes: lead.notes,
      scheduled_meeting_date: lead.scheduledMeetingDate || null,
      quantity: lead.quantity || 1,
      product_id: lead.product_id || null,
      estimated_value: lead.estimatedValue || 0,
      cnpj: lead.cnpj || null,
      website: lead.website || null,
      instagram: lead.instagram || null,
      facebook: lead.facebook || null,
      responded: lead.responded || false,
    } as any

    const { data, error } = await supabase
      .from('leads')
      .insert(dbLead)
      .select()
      .single()

    if (error) {
      console.error('Supabase Error:', error)
      throw error
    }

    if (data) {
      const newLead: Lead = {
        ...lead,
        id: data.id,
        createdAt: data.created_at,
        product_id: (data as any).product_id || undefined,
        meetings: [],
      }
      set((state) => ({ leads: [newLead, ...state.leads] }))

      if (lead.status === 'Em Negociação') {
        const { data: newOpp } = await supabase
          .from('opportunities')
          .select('*')
          .eq('lead_id', data.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (newOpp) {
          const mappedOpp: Opportunity = {
            id: newOpp.id,
            leadId: newOpp.lead_id || '',
            userId: newOpp.user_id || '',
            type: newOpp.type as OppType,
            service: newOpp.service,
            value: Number(newOpp.value),
            status: newOpp.status as OppStatus,
            createdAt: newOpp.created_at,
            updatedAt: newOpp.updated_at,
            quantity: Number((newOpp as any).quantity || 1),
          }
          set((state) => ({
            opportunities: [mappedOpp, ...state.opportunities],
          }))
        }
      }

      return data.id
    }
    return ''
  },

  updateLead: async (id, data) => {
    const updatePayload: any = {}
    if (data.userId !== undefined) {
      updatePayload.user_id = data.userId
    }
    if (data.status !== undefined) {
      updatePayload.status = data.status
      if (data.status === 'Em Negociação') {
        const currentUser = get().currentUser
        if (currentUser && currentUser.role !== 'ADMIN') {
          updatePayload.user_id = currentUser.id
          data.userId = currentUser.id
        }
      }
    }
    if (data.company !== undefined) updatePayload.company = data.company
    if (data.origin !== undefined) updatePayload.origin = data.origin
    if (data.email !== undefined) updatePayload.email = data.email
    if (data.phone !== undefined) updatePayload.phone = data.phone
    if (data.scheduledMeetingDate !== undefined)
      updatePayload.scheduled_meeting_date = data.scheduledMeetingDate || null
    if (data.notes !== undefined) updatePayload.notes = data.notes
    if (data.objectives !== undefined)
      updatePayload.objectives = data.objectives
    if (data.quantity !== undefined) updatePayload.quantity = data.quantity
    if (data.product_id !== undefined)
      updatePayload.product_id = data.product_id
    if (data.estimatedValue !== undefined)
      updatePayload.estimated_value = data.estimatedValue
    if (data.cnpj !== undefined) updatePayload.cnpj = data.cnpj
    if (data.website !== undefined) updatePayload.website = data.website
    if (data.instagram !== undefined) updatePayload.instagram = data.instagram
    if (data.facebook !== undefined) updatePayload.facebook = data.facebook
    if (data.responded !== undefined) updatePayload.responded = data.responded

    if (data.meetings && data.meetings.length > 0) {
      const currentLead = get().leads.find((l) => l.id === id)
      const existingMeetingIds = currentLead?.meetings.map((m) => m.id) || []
      const newMeetings = data.meetings.filter(
        (m) => !existingMeetingIds.includes(m.id),
      )

      for (const nm of newMeetings) {
        await supabase.from('meetings').insert({
          lead_id: id,
          date: nm.date,
          notes: nm.notes,
        })
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      await supabase.from('leads').update(updatePayload).eq('id', id)
    }

    if (data.estimatedValue !== undefined || data.product_id !== undefined) {
      const existingOpp = get().opportunities.find((o) => o.leadId === id)
      if (existingOpp) {
        const oppUpdate: any = {}
        if (data.estimatedValue !== undefined)
          oppUpdate.value = data.estimatedValue
        if (data.product_id !== undefined) {
          const { data: prod } = await supabase
            .from('products')
            .select('name')
            .eq('id', data.product_id)
            .single()
          if (prod) oppUpdate.service = prod.name
        }
        if (Object.keys(oppUpdate).length > 0) {
          await supabase
            .from('opportunities')
            .update(oppUpdate)
            .eq('id', existingOpp.id)
          set((state) => ({
            opportunities: state.opportunities.map((o) =>
              o.id === existingOpp.id ? { ...o, ...oppUpdate } : o,
            ),
          }))
        }
      }
    }

    if (data.status === 'Em Negociação') {
      const currentLead = get().leads.find((l) => l.id === id)
      const existingOpp = get().opportunities.find((o) => o.leadId === id)
      if (currentLead && !existingOpp) {
        const { data: newOpp } = await supabase
          .from('opportunities')
          .select('*')
          .eq('lead_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (newOpp) {
          const mappedOpp: Opportunity = {
            id: newOpp.id,
            leadId: newOpp.lead_id || '',
            userId: newOpp.user_id || '',
            type: newOpp.type as OppType,
            service: newOpp.service,
            value: Number(newOpp.value),
            status: newOpp.status as OppStatus,
            createdAt: newOpp.created_at,
            updatedAt: newOpp.updated_at,
            quantity: Number((newOpp as any).quantity || 1),
          }
          set((state) => ({
            opportunities: state.opportunities.some(
              (o) => o.id === mappedOpp.id,
            )
              ? state.opportunities
              : [mappedOpp, ...state.opportunities],
          }))
        }
      }
    }

    if (data.meetings && data.meetings.length > 0) {
      await get().fetchInitialData()
    } else {
      set((state) => ({
        leads: state.leads.map((l) => (l.id === id ? { ...l, ...data } : l)),
      }))
    }
  },

  addOpportunity: async (opp) => {
    const dbOpp = {
      lead_id: opp.leadId,
      user_id: opp.userId || null,
      type: opp.type,
      service: opp.service,
      value: opp.value,
      status: opp.status,
      quantity: opp.quantity || 1,
      closed_date: opp.closedDate || null,
      amount_paid: opp.amountPaid || 0,
    }

    const { data } = await supabase
      .from('opportunities')
      .insert(dbOpp)
      .select()
      .single()

    if (data) {
      const currentUser = get().currentUser
      const leadUpdate: any = { status: 'Em Negociação' }
      let newUserId: string | undefined = undefined

      if (currentUser && currentUser.role !== 'ADMIN') {
        leadUpdate.user_id = currentUser.id
        newUserId = currentUser.id
      }

      await supabase.from('leads').update(leadUpdate).eq('id', opp.leadId)

      const newOpp: Opportunity = {
        ...opp,
        id: data.id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
      set((state) => ({
        opportunities: [newOpp, ...state.opportunities],
        leads: state.leads.map((l) =>
          l.id === opp.leadId
            ? {
                ...l,
                status: 'Em Negociação',
                ...(newUserId ? { userId: newUserId } : {}),
              }
            : l,
        ),
      }))
      return data.id
    }
    return ''
  },

  updateOpportunityStatus: async (id, status) => {
    const opp = get().opportunities.find((o) => o.id === id)
    const currentUser = get().currentUser

    if (
      opp &&
      currentUser?.role === 'COMMERCIAL' &&
      (opp.status === 'Ganha' || (opp.status as string) === 'Fechado')
    ) {
      console.error(
        'Ação Bloqueada: Oportunidades ganhas/fechadas não podem ter seu status alterado por usuários comerciais.',
      )
      return
    }

    await supabase
      .from('opportunities')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    let newUserId: string | undefined = undefined
    if (opp) {
      if (status === 'Aberta' || status === 'Aguardando') {
        const currentUser = get().currentUser
        const leadUpdate: any = { status: 'Em Negociação' }
        if (currentUser && currentUser.role !== 'ADMIN') {
          leadUpdate.user_id = currentUser.id
          newUserId = currentUser.id
        }
        await supabase.from('leads').update(leadUpdate).eq('id', opp.leadId)
      } else if (status === 'Ganha') {
        setTimeout(async () => {
          if (opp.leadId) {
            const { data } = await supabase
              .from('customers')
              .select('*')
              .eq('lead_id', opp.leadId)
              .single()
            if (data) {
              const newCustomer = {
                id: data.id,
                leadId: data.lead_id || undefined,
                userId: data.user_id || '',
                name: data.name,
                company: data.company,
                email: data.email || '',
                phone: data.phone || '',
                cnpj: data.cnpj || '',
                createdAt: data.created_at,
              }
              const exists = get().customers.some(
                (c) => c.id === newCustomer.id,
              )
              if (!exists) {
                set((state) => ({
                  customers: [newCustomer, ...state.customers],
                }))
              }
            }
          }
        }, 1000)
      }
    }

    set((state) => {
      const newOpps = state.opportunities.map((o) =>
        o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
      )

      let newLeads = state.leads
      if (opp) {
        let leadStatus: LeadStatus | null = null
        if (status === 'Ganha') leadStatus = 'Ganho'
        else if (status === 'Perdida') leadStatus = 'Perdido'
        else if (status === 'Aberta' || status === 'Aguardando')
          leadStatus = 'Em Negociação'

        if (leadStatus) {
          newLeads = state.leads.map((l) =>
            l.id === opp.leadId
              ? {
                  ...l,
                  status: leadStatus as LeadStatus,
                  ...(newUserId ? { userId: newUserId } : {}),
                }
              : l,
          )
        }
      }

      return {
        opportunities: newOpps,
        leads: newLeads,
      }
    })
  },

  updateOpportunity: async (id, data) => {
    const updatePayload: any = {}
    if (data.status !== undefined) updatePayload.status = data.status
    if (data.closedDate !== undefined)
      updatePayload.closed_date = data.closedDate || null
    if (data.amountPaid !== undefined)
      updatePayload.amount_paid = data.amountPaid
    if (data.service !== undefined) updatePayload.service = data.service
    if (data.value !== undefined) updatePayload.value = data.value
    if (data.quantity !== undefined) updatePayload.quantity = data.quantity

    if (Object.keys(updatePayload).length > 0) {
      await supabase.from('opportunities').update(updatePayload).eq('id', id)
      set((state) => ({
        opportunities: state.opportunities.map((o) =>
          o.id === id
            ? { ...o, ...data, updatedAt: new Date().toISOString() }
            : o,
        ),
      }))
    }
  },

  addMessage: async (msg) => {
    const dbMsg = {
      from_id: msg.fromId,
      to_id: msg.toId,
      text: msg.text,
      file_url: msg.fileUrl || null,
    }

    const { data } = await supabase
      .from('messages')
      .insert(dbMsg)
      .select()
      .single()

    if (data) {
      const newMsg: Message = {
        ...msg,
        id: data.id,
        createdAt: data.created_at,
        read: data.read,
      }
      set((state) => ({ messages: [...state.messages, newMsg] }))
    }
  },

  markMessageRead: async (id) => {
    await supabase.from('messages').update({ read: true }).eq('id', id)
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, read: true } : m,
      ),
    }))
  },

  addResource: async (res) => {
    const dbRes = {
      title: res.title,
      description: res.desc,
      tag: res.tag,
      url: res.url || null,
    }

    const { data } = await supabase
      .from('resources')
      .insert(dbRes)
      .select()
      .single()

    if (data) {
      const newRes: Resource = {
        id: data.id,
        title: data.title,
        desc: data.description || '',
        tag: data.tag,
        url: data.url || undefined,
      }
      set((state) => ({ resources: [newRes, ...state.resources] }))
    }
  },

  removeResource: async (id) => {
    await supabase.from('resources').delete().eq('id', id)
    set((state) => ({
      resources: state.resources.filter((r) => r.id !== id),
    }))
  },

  addCustomer: async (cust) => {
    const dbCust: any = {
      user_id: cust.userId,
      name: cust.name,
      company: cust.company,
      email: cust.email || null,
      phone: cust.phone || null,
      cnpj: cust.cnpj || null,
    }

    if (cust.leadId) {
      dbCust.lead_id = cust.leadId
    }

    const { data } = await supabase
      .from('customers')
      .insert(dbCust)
      .select()
      .single()

    if (data) {
      const newCust: Customer = {
        ...cust,
        id: data.id,
        createdAt: data.created_at,
      }
      set((state) => ({ customers: [newCust, ...state.customers] }))
      return data.id
    }
    return ''
  },

  updateCustomer: async (id, data) => {
    const updatePayload: any = {}
    if (data.company !== undefined) updatePayload.company = data.company
    if (data.cnpj !== undefined) updatePayload.cnpj = data.cnpj
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.email !== undefined) updatePayload.email = data.email
    if (data.phone !== undefined) updatePayload.phone = data.phone

    if (Object.keys(updatePayload).length > 0) {
      await supabase.from('customers').update(updatePayload).eq('id', id)
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, ...data } : c,
        ),
      }))
    }
  },

  deleteCustomer: async (id) => {
    await supabase.from('customers').delete().eq('id', id)
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    }))
  },

  addCategory: async (cat) => {
    const { data } = await supabase
      .from('categories')
      .insert(cat)
      .select()
      .single()
    if (data) {
      set((state) => ({
        categories: [
          ...state.categories,
          {
            id: data.id,
            name: data.name,
            description: data.description || undefined,
          },
        ],
      }))
      return data.id
    }
    return ''
  },

  updateCategory: async (id, data) => {
    await supabase.from('categories').update(data).eq('id', id)
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...data } : c,
      ),
    }))
  },

  deleteCategory: async (id) => {
    await supabase.from('categories').delete().eq('id', id)
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }))
  },

  addService: async (svc) => {
    const dbSvc = {
      name: svc.name,
      category_id: svc.categoryId || null,
      base_value: svc.baseValue,
      ceiling_value: svc.ceilingValue,
    }
    const { data } = await supabase
      .from('services')
      .insert(dbSvc)
      .select()
      .single()
    if (data) {
      const newSvc: Service = {
        id: data.id,
        name: data.name,
        categoryId: data.category_id || undefined,
        baseValue: Number(data.base_value),
        ceilingValue: Number(data.ceiling_value),
      }
      set((state) => ({ services: [...state.services, newSvc] }))
      return data.id
    }
    return ''
  },

  updateService: async (id, data) => {
    const updatePayload: any = {}
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.categoryId !== undefined)
      updatePayload.category_id = data.categoryId || null
    if (data.baseValue !== undefined) updatePayload.base_value = data.baseValue
    if (data.ceilingValue !== undefined)
      updatePayload.ceiling_value = data.ceilingValue

    if (Object.keys(updatePayload).length > 0) {
      await supabase.from('services').update(updatePayload).eq('id', id)
      set((state) => ({
        services: state.services.map((s) =>
          s.id === id ? { ...s, ...data } : s,
        ),
      }))
    }
  },

  deleteService: async (id) => {
    await supabase.from('services').delete().eq('id', id)
    set((state) => ({
      services: state.services.filter((s) => s.id !== id),
    }))
  },

  addOnboarding: async (onboarding) => {
    const session = await supabase.auth.getSession()
    const userId = session.data.session?.user?.id
    if (!userId) return ''

    const dbOnboarding = {
      opportunity_id: onboarding.opportunityId,
      user_id: userId,
      company_name: onboarding.companyName,
      cnpj: onboarding.cnpj,
      phone: onboarding.phone,
      email: onboarding.email,
      site: onboarding.site,
      instagram: onboarding.instagram,
      facebook: onboarding.facebook,
      service_description: onboarding.serviceDescription,
      marketing_context: onboarding.marketingContext,
    }

    const { data } = await supabase
      .from('onboardings')
      .insert(dbOnboarding)
      .select()
      .single()

    if (data) {
      const newOnboarding: OnboardingData = {
        ...onboarding,
        id: data.id,
        userId: userId,
        createdAt: data.created_at,
      }
      set((state) => ({ onboardings: [newOnboarding, ...state.onboardings] }))
      return data.id
    }
    return ''
  },

  addBrand: async (brand) => {
    const { data } = await supabase
      .from('brands')
      .insert(brand)
      .select()
      .single()
    if (data) {
      const newBrand: Brand = {
        id: data.id,
        name: data.name,
        createdAt: data.created_at,
      }
      set((state) => ({
        brands: [...state.brands, newBrand].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      }))
      return data.id
    }
    return ''
  },

  updateBrand: async (id, data) => {
    await supabase.from('brands').update(data).eq('id', id)
    set((state) => ({
      brands: state.brands
        .map((b) => (b.id === id ? { ...b, ...data } : b))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
  },

  deleteBrand: async (id) => {
    await supabase.from('brands').delete().eq('id', id)
    set((state) => ({
      brands: state.brands.filter((b) => b.id !== id),
      products: state.products.filter((p) => p.brandId !== id),
    }))
  },

  addProductCategory: async (cat) => {
    const { data } = await supabase
      .from('product_categories')
      .insert(cat)
      .select()
      .single()
    if (data) {
      const newCat: ProductCategory = {
        id: data.id,
        name: data.name,
        createdAt: data.created_at,
      }
      set((state) => ({
        productCategories: [...state.productCategories, newCat].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      }))
      return data.id
    }
    return ''
  },

  deleteProductCategory: async (id) => {
    await supabase.from('product_categories').delete().eq('id', id)
    set((state) => ({
      productCategories: state.productCategories.filter((c) => c.id !== id),
    }))
  },

  addProduct: async (product) => {
    const dbProduct = {
      brand_id: product.brandId,
      category_id: product.categoryId || null,
      name: product.name,
      search_terms: product.searchTerms,
      price: product.price || 0,
    }
    const { data } = await supabase
      .from('products')
      .insert(dbProduct)
      .select()
      .single()
    if (data) {
      const newProduct: Product = {
        id: data.id,
        brandId: data.brand_id || '',
        categoryId: data.category_id || undefined,
        name: data.name,
        searchTerms: data.search_terms || '',
        price: Number(data.price || 0),
        createdAt: data.created_at,
      }
      set((state) => ({
        products: [...state.products, newProduct].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      }))
      return data.id
    }
    return ''
  },

  updateProduct: async (id, data) => {
    const updatePayload: any = {}
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.brandId !== undefined) updatePayload.brand_id = data.brandId
    if (data.categoryId !== undefined)
      updatePayload.category_id = data.categoryId || null
    if (data.searchTerms !== undefined)
      updatePayload.search_terms = data.searchTerms
    if (data.price !== undefined) updatePayload.price = data.price

    if (Object.keys(updatePayload).length > 0) {
      await supabase.from('products').update(updatePayload).eq('id', id)
      set((state) => ({
        products: state.products
          .map((p) => (p.id === id ? { ...p, ...data } : p))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
    }
  },

  deleteProduct: async (id) => {
    await supabase.from('products').delete().eq('id', id)
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }))
  },
}))
