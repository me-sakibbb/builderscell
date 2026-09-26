// Generated from the Supabase schema. Regenerate after every migration:
//   curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" "https://api.supabase.com/v1/projects/yyajrwdgkyviuiavfbpk/types/typescript?included_schemas=public"
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
      campaigns: {
        Row: {
          allows_individual: boolean
          allows_team: boolean
          capacity: number | null
          created_at: string
          description: string | null
          ends_on: string | null
          eyebrow: string | null
          fee_lines: Json
          highlights: Json
          id: string
          individual_fee_bdt: number | null
          kind: string
          location: string | null
          max_class_level: number | null
          min_class_level: number | null
          payment_instructions: string | null
          payment_numbers: Json
          registration_closes_at: string | null
          registration_opens_at: string | null
          slug: string
          starts_on: string | null
          status: string
          status_rank: number | null
          summary: string
          team_fee_bdt: number | null
          team_max_members: number
          team_min_members: number
          title: string
          updated_at: string
        }
        Insert: {
          allows_individual?: boolean
          allows_team?: boolean
          capacity?: number | null
          created_at?: string
          description?: string | null
          ends_on?: string | null
          eyebrow?: string | null
          fee_lines?: Json
          highlights?: Json
          id?: string
          individual_fee_bdt?: number | null
          kind?: string
          location?: string | null
          max_class_level?: number | null
          min_class_level?: number | null
          payment_instructions?: string | null
          payment_numbers?: Json
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          slug: string
          starts_on?: string | null
          status?: string
          summary: string
          team_fee_bdt?: number | null
          team_max_members?: number
          team_min_members?: number
          title: string
          updated_at?: string
        }
        Update: {
          allows_individual?: boolean
          allows_team?: boolean
          capacity?: number | null
          created_at?: string
          description?: string | null
          ends_on?: string | null
          eyebrow?: string | null
          fee_lines?: Json
          highlights?: Json
          id?: string
          individual_fee_bdt?: number | null
          kind?: string
          location?: string | null
          max_class_level?: number | null
          min_class_level?: number | null
          payment_instructions?: string | null
          payment_numbers?: Json
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          slug?: string
          starts_on?: string | null
          status?: string
          summary?: string
          team_fee_bdt?: number | null
          team_max_members?: number
          team_min_members?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          code: string | null
          code_source: string | null
          created_at: string
          district: string | null
          eiin: string | null
          id: string
          name: string
          ownership: string | null
          short_name: string | null
          type: string
        }
        Insert: {
          code?: string | null
          code_source?: string | null
          created_at?: string
          district?: string | null
          eiin?: string | null
          id?: string
          name: string
          ownership?: string | null
          short_name?: string | null
          type: string
        }
        Update: {
          code?: string | null
          code_source?: string | null
          created_at?: string
          district?: string | null
          eiin?: string | null
          id?: string
          name?: string
          ownership?: string | null
          short_name?: string | null
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          class_level: number | null
          created_at: string
          dob: string | null
          email: string | null
          full_name: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          institution_id: string | null
          institution_other: string | null
          is_admin: boolean
          onboarded_at: string | null
          phone: string | null
          roll: string | null
          section: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          class_level?: number | null
          created_at?: string
          dob?: string | null
          email?: string | null
          full_name?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id: string
          institution_id?: string | null
          institution_other?: string | null
          is_admin?: boolean
          onboarded_at?: string | null
          phone?: string | null
          roll?: string | null
          section?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          class_level?: number | null
          created_at?: string
          dob?: string | null
          email?: string | null
          full_name?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          institution_id?: string | null
          institution_other?: string | null
          is_admin?: boolean
          onboarded_at?: string | null
          phone?: string | null
          roll?: string | null
          section?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_members: {
        Row: {
          address: string
          class_level: number
          consent_guardian: boolean
          consent_media: boolean
          consent_safety: boolean
          created_at: string
          dob: string
          email: string
          full_name: string
          guardian_name: string
          guardian_phone: string
          id: string
          institution_id: string | null
          institution_other: string | null
          phone: string
          position: number
          registration_id: string
          roll: string
          section: string
          user_id: string | null
        }
        Insert: {
          address: string
          class_level: number
          consent_guardian: boolean
          consent_media: boolean
          consent_safety: boolean
          created_at?: string
          dob: string
          email: string
          full_name: string
          guardian_name: string
          guardian_phone: string
          id?: string
          institution_id?: string | null
          institution_other?: string | null
          phone: string
          position: number
          registration_id: string
          roll: string
          section: string
          user_id?: string | null
        }
        Update: {
          address?: string
          class_level?: number
          consent_guardian?: boolean
          consent_media?: boolean
          consent_safety?: boolean
          created_at?: string
          dob?: string
          email?: string
          full_name?: string
          guardian_name?: string
          guardian_phone?: string
          id?: string
          institution_id?: string | null
          institution_other?: string | null
          phone?: string
          position?: number
          registration_id?: string
          roll?: string
          section?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_members_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_members_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          campaign_id: string
          created_at: string
          draft: Json
          fee_bdt: number | null
          heard_from: string | null
          heard_from_other: string | null
          id: string
          member_count: number | null
          payment_method: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          step: number
          submitted_at: string | null
          transaction_id: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          draft?: Json
          fee_bdt?: number | null
          heard_from?: string | null
          heard_from_other?: string | null
          id?: string
          member_count?: number | null
          payment_method?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          step?: number
          submitted_at?: string | null
          transaction_id?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          draft?: Json
          fee_bdt?: number | null
          heard_from?: string | null
          heard_from_other?: string | null
          id?: string
          member_count?: number | null
          payment_method?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          step?: number
          submitted_at?: string | null
          transaction_id?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_registrations: {
        Args: {
          p_campaign?: string
          p_limit?: number
          p_offset?: number
          p_q?: string
          p_status?: string
        }
        Returns: {
          campaign_id: string
          campaign_slug: string
          campaign_title: string
          fee_bdt: number
          id: string
          lead_email: string
          lead_name: string
          member_count: number
          member_names: string[]
          payment_method: string
          review_note: string
          reviewed_at: string
          status: string
          submitted_at: string
          total_count: number
          transaction_id: string
          type: string
        }[]
      }
      campaign_is_full: { Args: { p_campaign_id: string }; Returns: boolean }
      campaign_stats: {
        Args: { p_campaign_id: string }
        Returns: {
          approved: number
          capacity: number
          pending: number
          rejected: number
          seats_taken: number
        }[]
      }
      find_member_by_email: {
        Args: { p_email: string }
        Returns: {
          address: string
          class_level: number
          dob: string
          email: string
          full_name: string
          guardian_name: string
          guardian_phone: string
          institution_id: string
          institution_name: string
          institution_other: string
          phone: string
          roll: string
          section: string
          user_id: string
        }[]
      }
      is_admin: { Args: { uid?: string }; Returns: boolean }
      review_registration: {
        Args: { p_action: string; p_note?: string; p_registration_id: string }
        Returns: string
      }
      search_institutions: {
        Args: { lim?: number; off?: number; q?: string }
        Returns: {
          code: string | null
          code_source: string | null
          created_at: string
          district: string | null
          eiin: string | null
          id: string
          name: string
          ownership: string | null
          short_name: string | null
          type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "institutions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      submit_registration: {
        Args: { p_payload: Json; p_registration_id: string }
        Returns: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
