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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
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
            foreignKeyName: "customers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            foreignKeyName: "interest_mapping_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interest_mapping_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
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
            foreignKeyName: "lead_products_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
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
            foreignKeyName: "leads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            foreignKeyName: "meetings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
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
            foreignKeyName: "messages_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_to_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            foreignKeyName: "onboardings_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboardings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            foreignKeyName: "opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
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
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
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
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const


// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: brands
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: customers
//   id: uuid (not null, default: gen_random_uuid())
//   created_at: timestamp with time zone (not null, default: now())
//   lead_id: uuid (nullable)
//   user_id: uuid (nullable)
//   name: text (not null, default: ''::text)
//   company: text (not null, default: ''::text)
//   email: text (nullable)
//   phone: text (nullable)
//   cnpj: text (nullable)
// Table: interest_mapping
//   id: integer (not null, default: nextval('interest_mapping_id_seq'::regclass))
//   term_pattern: text (not null)
//   category_id: uuid (not null)
//   product_id: uuid (nullable)
//   priority: integer (nullable, default: 0)
// Table: lead_products
//   id: uuid (not null, default: gen_random_uuid())
//   lead_id: uuid (not null)
//   product_id: uuid (not null)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: leads
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   contact: text (not null)
//   company: text (not null)
//   email: text (nullable)
//   phone: text (nullable)
//   status: text (not null, default: 'Novo'::text)
//   country: text (not null, default: 'Brazil'::text)
//   city: text (nullable)
//   origin: text (not null, default: 'Site'::text)
//   marketing_status: text (nullable)
//   objectives: text (nullable)
//   notes: text (nullable)
//   scheduled_meeting_date: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   product_id: uuid (nullable)
//   estimated_value: numeric (nullable, default: 0)
//   cnpj: text (nullable)
//   website: text (nullable)
//   instagram: text (nullable)
//   facebook: text (nullable)
//   quantity: numeric (nullable, default: 1)
//   responded: boolean (nullable)
//   status_priority: integer (nullable, default: 1)
//   category_id: uuid (nullable)
// Table: meetings
//   id: uuid (not null, default: gen_random_uuid())
//   lead_id: uuid (nullable)
//   date: timestamp with time zone (not null)
//   notes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: messages
//   id: uuid (not null, default: gen_random_uuid())
//   from_id: uuid (nullable)
//   to_id: uuid (nullable)
//   text: text (not null)
//   file_url: text (nullable)
//   read: boolean (nullable, default: false)
//   created_at: timestamp with time zone (not null, default: now())
// Table: onboardings
//   id: uuid (not null, default: gen_random_uuid())
//   opportunity_id: uuid (nullable)
//   user_id: uuid (nullable)
//   company_name: text (not null)
//   cnpj: text (nullable)
//   phone: text (nullable)
//   email: text (nullable)
//   site: text (nullable)
//   instagram: text (nullable)
//   facebook: text (nullable)
//   service_description: text (nullable)
//   marketing_context: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: opportunities
//   id: uuid (not null, default: gen_random_uuid())
//   lead_id: uuid (nullable)
//   user_id: uuid (nullable)
//   type: text (not null)
//   service: text (not null)
//   value: numeric (not null, default: 0)
//   status: text (not null, default: 'Aberta'::text)
//   lead_needs: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   quantity: numeric (nullable, default: 1)
//   closed_date: timestamp with time zone (nullable)
//   amount_paid: numeric (nullable, default: 0)
// Table: product_categories
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: products
//   id: uuid (not null, default: gen_random_uuid())
//   brand_id: uuid (nullable)
//   name: text (not null)
//   search_terms: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   category_id: uuid (nullable)
//   price: numeric (not null, default: 0)
// Table: profiles
//   id: uuid (not null)
//   email: text (not null)
//   name: text (not null)
//   role: text (not null, default: 'COMMERCIAL'::text)
//   phone: text (nullable)
//   is_locked: boolean (nullable, default: false)
//   created_at: timestamp with time zone (not null, default: now())
//   avatar_url: text (nullable)
// Table: resources
//   id: uuid (not null, default: gen_random_uuid())
//   title: text (not null)
//   description: text (nullable)
//   tag: text (not null)
//   url: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: role_permissions
//   id: uuid (not null, default: gen_random_uuid())
//   role_id: uuid (nullable)
//   resource: text (not null)
//   can_create: boolean (nullable, default: false)
//   can_read: boolean (nullable, default: false)
//   can_update: boolean (nullable, default: false)
//   can_delete: boolean (nullable, default: false)
//   created_at: timestamp with time zone (not null, default: now())
// Table: roles
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   description: text (nullable)
//   is_system: boolean (nullable, default: false)
//   created_at: timestamp with time zone (not null, default: now())
// Table: settings
//   key: text (not null)
//   value: jsonb (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())

// --- CONSTRAINTS ---
// Table: brands
//   UNIQUE brands_name_key: UNIQUE (name)
//   PRIMARY KEY brands_pkey: PRIMARY KEY (id)
// Table: customers
//   FOREIGN KEY customers_lead_id_fkey: FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
//   UNIQUE customers_lead_id_key: UNIQUE (lead_id)
//   PRIMARY KEY customers_pkey: PRIMARY KEY (id)
//   FOREIGN KEY customers_user_id_fkey: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
// Table: interest_mapping
//   FOREIGN KEY interest_mapping_category_id_fkey: FOREIGN KEY (category_id) REFERENCES product_categories(id)
//   PRIMARY KEY interest_mapping_pkey: PRIMARY KEY (id)
//   FOREIGN KEY interest_mapping_product_id_fkey: FOREIGN KEY (product_id) REFERENCES products(id)
// Table: lead_products
//   FOREIGN KEY lead_products_lead_id_fkey: FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
//   UNIQUE lead_products_lead_id_product_id_key: UNIQUE (lead_id, product_id)
//   PRIMARY KEY lead_products_pkey: PRIMARY KEY (id)
//   FOREIGN KEY lead_products_product_id_fkey: FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
// Table: leads
//   FOREIGN KEY leads_category_id_fkey: FOREIGN KEY (category_id) REFERENCES product_categories(id)
//   PRIMARY KEY leads_pkey: PRIMARY KEY (id)
//   FOREIGN KEY leads_product_id_fkey: FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
//   FOREIGN KEY leads_user_id_fkey: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: meetings
//   FOREIGN KEY meetings_lead_id_fkey: FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
//   PRIMARY KEY meetings_pkey: PRIMARY KEY (id)
// Table: messages
//   FOREIGN KEY messages_from_id_fkey: FOREIGN KEY (from_id) REFERENCES profiles(id) ON DELETE CASCADE
//   PRIMARY KEY messages_pkey: PRIMARY KEY (id)
//   FOREIGN KEY messages_to_id_fkey: FOREIGN KEY (to_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: onboardings
//   FOREIGN KEY onboardings_opportunity_id_fkey: FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
//   PRIMARY KEY onboardings_pkey: PRIMARY KEY (id)
//   FOREIGN KEY onboardings_user_id_fkey: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
// Table: opportunities
//   FOREIGN KEY opportunities_lead_id_fkey: FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
//   PRIMARY KEY opportunities_pkey: PRIMARY KEY (id)
//   FOREIGN KEY opportunities_user_id_fkey: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: product_categories
//   UNIQUE product_categories_name_key: UNIQUE (name)
//   PRIMARY KEY product_categories_pkey: PRIMARY KEY (id)
// Table: products
//   FOREIGN KEY products_brand_id_fkey: FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
//   UNIQUE products_brand_id_name_key: UNIQUE (brand_id, name)
//   FOREIGN KEY products_category_id_fkey: FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
//   PRIMARY KEY products_pkey: PRIMARY KEY (id)
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: resources
//   PRIMARY KEY resources_pkey: PRIMARY KEY (id)
// Table: role_permissions
//   PRIMARY KEY role_permissions_pkey: PRIMARY KEY (id)
//   FOREIGN KEY role_permissions_role_id_fkey: FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
//   UNIQUE role_permissions_role_id_resource_key: UNIQUE (role_id, resource)
// Table: roles
//   UNIQUE roles_name_key: UNIQUE (name)
//   PRIMARY KEY roles_pkey: PRIMARY KEY (id)
// Table: settings
//   PRIMARY KEY settings_pkey: PRIMARY KEY (key)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: brands
//   Policy "authenticated_delete_brands" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_insert_brands" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_select_brands" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_update_brands" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: customers
//   Policy "customers_admin_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text))))
//   Policy "customers_commercial_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
//   Policy "customers_commercial_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((user_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
//   Policy "customers_commercial_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
//   Policy "customers_commercial_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
//     WITH CHECK: ((user_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
// Table: lead_products
//   Policy "authenticated_delete_lead_products" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_insert_lead_products" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_select_lead_products" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_update_lead_products" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: leads
//   Policy "leads_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((user_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
//   Policy "leads_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (user_id IS NULL) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
//   Policy "leads_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (user_id IS NULL) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
// Table: meetings
//   Policy "meetings_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM leads   WHERE ((leads.id = meetings.lead_id) AND (leads.user_id = auth.uid()))))
//   Policy "meetings_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM (leads l      LEFT JOIN profiles p ON ((p.id = auth.uid())))   WHERE ((l.id = meetings.lead_id) AND ((p.role = 'ADMIN'::text) OR (l.user_id = auth.uid())))))
// Table: messages
//   Policy "messages_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (from_id = auth.uid())
//   Policy "messages_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((from_id = auth.uid()) OR (to_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
//   Policy "messages_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (to_id = auth.uid())
// Table: onboardings
//   Policy "onboardings_admin_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text))))
//   Policy "onboardings_user_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "onboardings_user_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "onboardings_user_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
//   Policy "onboardings_user_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: opportunities
//   Policy "opps_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((user_id = auth.uid()) OR (user_id IS NULL) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
//   Policy "opps_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (user_id IS NULL) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
//   Policy "opps_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (user_id IS NULL) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text)))))
// Table: product_categories
//   Policy "authenticated_delete_product_categories" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_insert_product_categories" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_select_product_categories" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_update_product_categories" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: products
//   Policy "authenticated_delete_products" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_insert_products" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_select_products" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_update_products" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: profiles
//   Policy "profiles_admin_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles profiles_1   WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'ADMIN'::text))))
//   Policy "profiles_admin_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles profiles_1   WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'ADMIN'::text))))
//   Policy "profiles_admin_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles profiles_1   WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'ADMIN'::text))))
//   Policy "profiles_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "profiles_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = id)
// Table: resources
//   Policy "resources_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text))))
//   Policy "resources_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text))))
//   Policy "resources_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "resources_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text))))
// Table: role_permissions
//   Policy "role_permissions_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text))))
//   Policy "role_permissions_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text))))
//   Policy "role_permissions_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "role_permissions_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text))))
// Table: roles
//   Policy "roles_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text))))
//   Policy "roles_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text))))
//   Policy "roles_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "roles_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::text))))
// Table: settings
//   Policy "settings_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true

// --- WARNING: TABLES WITH RLS ENABLED BUT NO POLICIES ---
// These tables have Row Level Security enabled but NO policies defined.
// This means ALL queries (SELECT, INSERT, UPDATE, DELETE) will return ZERO rows
// for non-superuser roles (including the anon and authenticated roles used by the app).
// You MUST create RLS policies for these tables to allow data access.
//   - interest_mapping

// --- DATABASE FUNCTIONS ---
// FUNCTION admin_create_user(text, text, text, text, text)
//   CREATE OR REPLACE FUNCTION public.admin_create_user(new_email text, new_password text, new_name text, new_role text, new_phone text DEFAULT NULL::text)
//    RETURNS jsonb
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public', 'auth', 'extensions'
//   AS $function$
//   DECLARE
//     is_admin boolean;
//     new_user_id uuid;
//   BEGIN
//     -- Verifica se o usuário atual é ADMIN
//     SELECT (role = 'ADMIN') INTO is_admin FROM public.profiles WHERE id = auth.uid();
//     
//     IF is_admin IS NULL OR NOT is_admin THEN
//       RETURN jsonb_build_object('success', false, 'error', 'Acesso negado: apenas administradores podem criar usuários.');
//     END IF;
//   
//     IF EXISTS (SELECT 1 FROM auth.users WHERE email = new_email) THEN
//       RETURN jsonb_build_object('success', false, 'error', 'E-mail já está em uso.');
//     END IF;
//   
//     new_user_id := gen_random_uuid();
//   
//     INSERT INTO auth.users (
//       id, instance_id, email, encrypted_password, email_confirmed_at,
//       created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
//       is_super_admin, role, aud,
//       confirmation_token, recovery_token, email_change_token_new,
//       email_change, email_change_token_current,
//       phone, phone_change, phone_change_token, reauthentication_token
//     ) VALUES (
//       new_user_id,
//       '00000000-0000-0000-0000-000000000000',
//       new_email,
//       extensions.crypt(new_password, extensions.gen_salt('bf')),
//       now(), now(), now(),
//       '{"provider": "email", "providers": ["email"]}',
//       jsonb_build_object('name', new_name, 'role', new_role),
//       false, 'authenticated', 'authenticated',
//       '', '', '', '', '',
//       NULL, '', '', ''
//     );
//   
//     -- Atualiza o perfil criado pela trigger para incluir telefone se fornecido
//     IF new_phone IS NOT NULL AND new_phone <> '' THEN
//       UPDATE public.profiles SET phone = new_phone WHERE id = new_user_id;
//     END IF;
//   
//     RETURN jsonb_build_object('success', true, 'user_id', new_user_id);
//   END;
//   $function$
//   
// FUNCTION admin_update_user_credentials(uuid, text, text)
//   CREATE OR REPLACE FUNCTION public.admin_update_user_credentials(user_id_to_update uuid, new_email text DEFAULT NULL::text, new_password text DEFAULT NULL::text)
//    RETURNS jsonb
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public', 'auth', 'extensions'
//   AS $function$
//   DECLARE
//     is_admin boolean;
//   BEGIN
//     -- Verifica se o usuário atual é ADMIN
//     SELECT (role = 'ADMIN') INTO is_admin FROM public.profiles WHERE id = auth.uid();
//     
//     IF is_admin IS NULL OR NOT is_admin THEN
//       RETURN jsonb_build_object('success', false, 'error', 'Acesso negado: apenas administradores podem alterar credenciais.');
//     END IF;
//   
//     -- Atualiza o e-mail, se fornecido
//     IF new_email IS NOT NULL AND new_email <> '' THEN
//       IF EXISTS (SELECT 1 FROM auth.users WHERE email = new_email AND id <> user_id_to_update) THEN
//         RETURN jsonb_build_object('success', false, 'error', 'E-mail já está em uso por outro usuário.');
//       END IF;
//       
//       UPDATE auth.users 
//       SET email = new_email, email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now()
//       WHERE id = user_id_to_update;
//       
//       UPDATE public.profiles 
//       SET email = new_email 
//       WHERE id = user_id_to_update;
//     END IF;
//   
//     -- Atualiza a senha, se fornecida
//     IF new_password IS NOT NULL AND new_password <> '' THEN
//       UPDATE auth.users 
//       SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')), updated_at = now()
//       WHERE id = user_id_to_update;
//     END IF;
//   
//     RETURN jsonb_build_object('success', true);
//   END;
//   $function$
//   
// FUNCTION handle_lead_status_change()
//   CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_service_name TEXT := 'Não especificado';
//   BEGIN
//     -- Tenta pegar o nome do produto se existir
//     IF NEW.product_id IS NOT NULL THEN
//       SELECT name INTO v_service_name FROM public.products WHERE id = NEW.product_id;
//     END IF;
//   
//     -- Cria uma oportunidade automaticamente se o lead for movido para "Em Negociação"
//     IF NEW.status = 'Em Negociação' AND (TG_OP = 'INSERT' OR OLD.status != 'Em Negociação') THEN
//       IF NOT EXISTS (SELECT 1 FROM public.opportunities WHERE lead_id = NEW.id) THEN
//         INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status, quantity)
//         VALUES (NEW.id, NEW.user_id, 'Fee Mensal', COALESCE(v_service_name, 'Não especificado'), COALESCE(NEW.estimated_value, 0), 'Aberta', COALESCE(NEW.quantity, 1));
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.profiles (id, email, name, role)
//     VALUES (
//       NEW.id,
//       NEW.email,
//       COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
//       COALESCE(NEW.raw_user_meta_data->>'role', 'COMMERCIAL')
//     ) ON CONFLICT (id) DO NOTHING;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION handle_opportunity_status_change()
//   CREATE OR REPLACE FUNCTION public.handle_opportunity_status_change()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_lead record;
//   BEGIN
//     IF NEW.status = 'Ganha' AND (TG_OP = 'INSERT' OR OLD.status != 'Ganha') THEN
//       UPDATE public.leads
//       SET status = 'Ganho'
//       WHERE id = NEW.lead_id AND status != 'Ganho';
//       
//       -- Sync with customers table automatically
//       SELECT * INTO v_lead FROM public.leads WHERE id = NEW.lead_id;
//       
//       IF FOUND THEN
//         INSERT INTO public.customers (lead_id, user_id, name, company, email, phone, cnpj)
//         VALUES (v_lead.id, v_lead.user_id, v_lead.contact, v_lead.company, v_lead.email, v_lead.phone, v_lead.cnpj)
//         ON CONFLICT (lead_id) DO NOTHING;
//       END IF;
//     ELSIF NEW.status = 'Perdida' AND (TG_OP = 'INSERT' OR OLD.status != 'Perdida') THEN
//       UPDATE public.leads
//       SET status = 'Perdido'
//       WHERE id = NEW.lead_id AND status != 'Perdido';
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION rls_auto_enable()
//   CREATE OR REPLACE FUNCTION public.rls_auto_enable()
//    RETURNS event_trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'pg_catalog'
//   AS $function$
//   DECLARE
//     cmd record;
//   BEGIN
//     FOR cmd IN
//       SELECT *
//       FROM pg_event_trigger_ddl_commands()
//       WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
//         AND object_type IN ('table','partitioned table')
//     LOOP
//        IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
//         BEGIN
//           EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
//           RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
//         EXCEPTION
//           WHEN OTHERS THEN
//             RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
//         END;
//        ELSE
//           RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
//        END IF;
//     END LOOP;
//   END;
//   $function$
//   
// FUNCTION set_current_timestamp_updated_at()
//   CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     NEW.updated_at = NOW();
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION sync_lead_status_priority()
//   CREATE OR REPLACE FUNCTION public.sync_lead_status_priority()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     NEW.status_priority = CASE NEW.status
//       WHEN 'Novo' THEN 1
//       WHEN 'Qualificado' THEN 2
//       WHEN 'Em Negociação' THEN 3
//       WHEN 'Ganho' THEN 4
//       WHEN 'Perdido' THEN 5
//       ELSE 99
//     END;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION update_opportunity_closed_date()
//   CREATE OR REPLACE FUNCTION public.update_opportunity_closed_date()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//       IF NEW.status = 'Ganho' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
//           NEW.closed_date = now();
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//   

// --- TRIGGERS ---
// Table: leads
//   on_lead_status_change: CREATE TRIGGER on_lead_status_change AFTER INSERT OR UPDATE OF status ON public.leads FOR EACH ROW EXECUTE FUNCTION handle_lead_status_change()
//   trigger_sync_lead_status_priority: CREATE TRIGGER trigger_sync_lead_status_priority BEFORE INSERT OR UPDATE OF status ON public.leads FOR EACH ROW EXECUTE FUNCTION sync_lead_status_priority()
// Table: opportunities
//   on_opportunity_status_change: CREATE TRIGGER on_opportunity_status_change AFTER INSERT OR UPDATE OF status ON public.opportunities FOR EACH ROW EXECUTE FUNCTION handle_opportunity_status_change()
//   set_opportunities_updated_at: CREATE TRIGGER set_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW WHEN (((old.quantity IS DISTINCT FROM new.quantity) OR (old.value IS DISTINCT FROM new.value))) EXECUTE FUNCTION set_current_timestamp_updated_at()
//   trigger_set_opportunity_closed_date: CREATE TRIGGER trigger_set_opportunity_closed_date BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION update_opportunity_closed_date()

// --- INDEXES ---
// Table: brands
//   CREATE UNIQUE INDEX brands_name_key ON public.brands USING btree (name)
// Table: customers
//   CREATE UNIQUE INDEX customers_lead_id_key ON public.customers USING btree (lead_id)
// Table: lead_products
//   CREATE INDEX idx_lead_products_lead_id ON public.lead_products USING btree (lead_id)
//   CREATE INDEX idx_lead_products_product_id ON public.lead_products USING btree (product_id)
//   CREATE UNIQUE INDEX lead_products_lead_id_product_id_key ON public.lead_products USING btree (lead_id, product_id)
// Table: onboardings
//   CREATE INDEX onboardings_opportunity_id_idx ON public.onboardings USING btree (opportunity_id)
//   CREATE INDEX onboardings_user_id_idx ON public.onboardings USING btree (user_id)
// Table: opportunities
//   CREATE INDEX idx_opportunities_created_at ON public.opportunities USING btree (created_at)
// Table: product_categories
//   CREATE UNIQUE INDEX product_categories_name_key ON public.product_categories USING btree (name)
// Table: products
//   CREATE UNIQUE INDEX products_brand_id_name_key ON public.products USING btree (brand_id, name)
// Table: role_permissions
//   CREATE UNIQUE INDEX role_permissions_role_id_resource_key ON public.role_permissions USING btree (role_id, resource)
// Table: roles
//   CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name)

