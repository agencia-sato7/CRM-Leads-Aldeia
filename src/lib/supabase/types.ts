// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          cnpj: string | null
          company: string
          created_at: string
          email: string | null
          id: string
          lead_id: string | null
          name: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          cnpj?: string | null
          company?: string
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          cnpj?: string | null
          company?: string
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'customers_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: true
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'customers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      interest_mapping: {
        Row: {
          category_id: string
          id: number
          priority: number | null
          product_id: string | null
          term_pattern: string
        }
        Insert: {
          category_id: string
          id?: number
          priority?: number | null
          product_id?: string | null
          term_pattern: string
        }
        Update: {
          category_id?: string
          id?: number
          priority?: number | null
          product_id?: string | null
          term_pattern?: string
        }
        Relationships: [
          {
            foreignKeyName: 'interest_mapping_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'product_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'interest_mapping_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      lead_products: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lead_products_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_products_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: {
          category_id: string | null
          city: string | null
          cnpj: string | null
          company: string
          contact: string
          country: string
          created_at: string
          email: string | null
          estimated_value: number | null
          facebook: string | null
          id: string
          instagram: string | null
          mapping_fixed: boolean | null
          marketing_status: string | null
          notes: string | null
          objectives: string | null
          origin: string
          phone: string | null
          product_id: string | null
          quantity: number | null
          responded: boolean | null
          scheduled_meeting_date: string | null
          status: string
          status_priority: number | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          category_id?: string | null
          city?: string | null
          cnpj?: string | null
          company: string
          contact: string
          country?: string
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          mapping_fixed?: boolean | null
          marketing_status?: string | null
          notes?: string | null
          objectives?: string | null
          origin?: string
          phone?: string | null
          product_id?: string | null
          quantity?: number | null
          responded?: boolean | null
          scheduled_meeting_date?: string | null
          status?: string
          status_priority?: number | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          category_id?: string | null
          city?: string | null
          cnpj?: string | null
          company?: string
          contact?: string
          country?: string
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          mapping_fixed?: boolean | null
          marketing_status?: string | null
          notes?: string | null
          objectives?: string | null
          origin?: string
          phone?: string | null
          product_id?: string | null
          quantity?: number | null
          responded?: boolean | null
          scheduled_meeting_date?: string | null
          status?: string
          status_priority?: number | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'leads_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'product_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          date: string
          id: string
          lead_id: string | null
          notes: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          lead_id?: string | null
          notes?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'meetings_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          file_url: string | null
          from_id: string | null
          id: string
          read: boolean | null
          text: string
          to_id: string | null
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          from_id?: string | null
          id?: string
          read?: boolean | null
          text: string
          to_id?: string | null
        }
        Update: {
          created_at?: string
          file_url?: string | null
          from_id?: string | null
          id?: string
          read?: boolean | null
          text?: string
          to_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'messages_from_id_fkey'
            columns: ['from_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_to_id_fkey'
            columns: ['to_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      onboardings: {
        Row: {
          cnpj: string | null
          company_name: string
          created_at: string
          email: string | null
          facebook: string | null
          id: string
          instagram: string | null
          marketing_context: string | null
          opportunity_id: string | null
          phone: string | null
          service_description: string | null
          site: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cnpj?: string | null
          company_name: string
          created_at?: string
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          marketing_context?: string | null
          opportunity_id?: string | null
          phone?: string | null
          service_description?: string | null
          site?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cnpj?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          marketing_context?: string | null
          opportunity_id?: string | null
          phone?: string | null
          service_description?: string | null
          site?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'onboardings_opportunity_id_fkey'
            columns: ['opportunity_id']
            isOneToOne: false
            referencedRelation: 'opportunities'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'onboardings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      opportunities: {
        Row: {
          amount_paid: number | null
          closed_date: string | null
          created_at: string
          id: string
          lead_id: string | null
          lead_needs: string | null
          quantity: number | null
          service: string
          status: string
          type: string
          updated_at: string
          user_id: string | null
          value: number
        }
        Insert: {
          amount_paid?: number | null
          closed_date?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          lead_needs?: string | null
          quantity?: number | null
          service: string
          status?: string
          type: string
          updated_at?: string
          user_id?: string | null
          value?: number
        }
        Update: {
          amount_paid?: number | null
          closed_date?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          lead_needs?: string | null
          quantity?: number | null
          service?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'opportunities_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'opportunities_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string
          id: string
          name: string
          price: number
          search_terms: string | null
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          name: string
          price?: number
          search_terms?: string | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          name?: string
          price?: number
          search_terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'products_brand_id_fkey'
            columns: ['brand_id']
            isOneToOne: false
            referencedRelation: 'brands'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'product_categories'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_locked: boolean | null
          name: string
          phone: string | null
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_locked?: boolean | null
          name: string
          phone?: string | null
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_locked?: boolean | null
          name?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          tag: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          tag: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          tag?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          created_at: string
          id: string
          resource: string
          role_id: string | null
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string
          id?: string
          resource: string
          role_id?: string | null
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string
          id?: string
          resource?: string
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'role_permissions_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_user: {
        Args: {
          new_email: string
          new_name: string
          new_password: string
          new_phone?: string
          new_role: string
        }
        Returns: Json
      }
      admin_update_user_credentials: {
        Args: {
          new_email?: string
          new_password?: string
          user_id_to_update: string
        }
        Returns: Json
      }
      f_unaccent: { Args: { input: string }; Returns: string }
      find_profile_by_name: { Args: { search_name: string }; Returns: string }
      unaccent: { Args: { '': string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
