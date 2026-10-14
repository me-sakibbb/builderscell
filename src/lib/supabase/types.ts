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
    PostgrestVersion: "14.17"
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
          status_rank?: number | null
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
          status_rank?: number | null
          summary?: string
          team_fee_bdt?: number | null
          team_max_members?: number
          team_min_members?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_campaigns: {
        Row: {
          campaign_id: string
          coupon_id: string
        }
        Insert: {
          campaign_id: string
          coupon_id: string
        }
        Update: {
          campaign_id?: string
          coupon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_campaigns_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_campaigns_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          all_campaigns: boolean
          applies_to_individual: boolean
          applies_to_team: boolean
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          display_enabled: boolean
          display_message: string | null
          display_show_code: boolean
          ends_at: string | null
          id: string
          individual_value_bdt: number | null
          is_active: boolean
          label: string | null
          max_discount_bdt: number | null
          max_redemptions: number | null
          percent_off: number | null
          starts_at: string | null
          team_value_bdt: number | null
          updated_at: string
        }
        Insert: {
          all_campaigns?: boolean
          applies_to_individual?: boolean
          applies_to_team?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          discount_type: string
          display_enabled?: boolean
          display_message?: string | null
          display_show_code?: boolean
          ends_at?: string | null
          id?: string
          individual_value_bdt?: number | null
          is_active?: boolean
          label?: string | null
          max_discount_bdt?: number | null
          max_redemptions?: number | null
          percent_off?: number | null
          starts_at?: string | null
          team_value_bdt?: number | null
          updated_at?: string
        }
        Update: {
          all_campaigns?: boolean
          applies_to_individual?: boolean
          applies_to_team?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          display_enabled?: boolean
          display_message?: string | null
          display_show_code?: boolean
          ends_at?: string | null
          id?: string
          individual_value_bdt?: number | null
          is_active?: boolean
          label?: string | null
          max_discount_bdt?: number | null
          max_redemptions?: number | null
          percent_off?: number | null
          starts_at?: string | null
          team_value_bdt?: number | null
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
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          discount_bdt: number | null
          draft: Json
          fee_bdt: number | null
          heard_from: string | null
          heard_from_other: string | null
          id: string
          member_count: number | null
          original_fee_bdt: number | null
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
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_bdt?: number | null
          draft?: Json
          fee_bdt?: number | null
          heard_from?: string | null
          heard_from_other?: string | null
          id?: string
          member_count?: number | null
          original_fee_bdt?: number | null
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
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_bdt?: number | null
          draft?: Json
          fee_bdt?: number | null
          heard_from?: string | null
          heard_from_other?: string | null
          id?: string
          member_count?: number | null
          original_fee_bdt?: number | null
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
          {
            foreignKeyName: "registrations_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_campaign_overview: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          approved: number
          capacity: number
          id: string
          pending: number
          rejected: number
          seats_taken: number
          slug: string
          status: string
          title: string
          total_count: number
        }[]
      }
      admin_list_coupons: {
        Args: { p_limit?: number; p_offset?: number; p_q?: string }
        Returns: {
          all_campaigns: boolean
          applies_to_individual: boolean
          applies_to_team: boolean
          approved_uses: number
          campaign_titles: string[]
          code: string
          discount_type: string
          display_enabled: boolean
          ends_at: string
          id: string
          individual_value_bdt: number
          is_active: boolean
          label: string
          max_discount_bdt: number
          max_redemptions: number
          pending_uses: number
          percent_off: number
          starts_at: string
          team_value_bdt: number
          total_count: number
        }[]
      }
      admin_list_registrations: {
        Args: {
          p_campaign?: string
          p_coupon?: string
          p_limit?: number
          p_offset?: number
          p_q?: string
          p_status?: string
        }
        Returns: {
          campaign_id: string
          campaign_slug: string
          campaign_title: string
          coupon_code: string
          discount_bdt: number
          fee_bdt: number
          id: string
          lead_email: string
          lead_name: string
          member_count: number
          member_names: string[]
          original_fee_bdt: number
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
      admin_overview_stats: {
        Args: never
        Returns: {
          approved: number
          pending: number
          rejected: number
          total: number
        }[]
      }
      admin_save_coupon: {
        Args: { p_id: string; p_payload: Json }
        Returns: string
      }
      campaign_is_full: { Args: { p_campaign_id: string }; Returns: boolean }
      campaign_offers: {
        Args: { p_campaign_ids: string[] }
        Returns: {
          campaign_id: string
          code: string
          discount: number
          final_fee: number
          message: string
          original_fee: number
          type: string
        }[]
      }
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
      coupon_discount: {
        Args: {
          p_base: number
          p_coupon: Database["public"]["Tables"]["coupons"]["Row"]
          p_type: string
        }
        Returns: number
      }
      coupon_is_live: {
        Args: { p_coupon: Database["public"]["Tables"]["coupons"]["Row"] }
        Returns: boolean
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
      preview_coupon: {
        Args: { p_campaign_id: string; p_code: string; p_type: string }
        Returns: {
          code: string
          discount: number
          final_fee: number
          original_fee: number
        }[]
      }
      quote_coupon: {
        Args: {
          p_base: number
          p_campaign_id: string
          p_code: string
          p_lock?: boolean
          p_type: string
        }
        Returns: {
          code: string
          coupon_id: string
          discount: number
        }[]
      }
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
