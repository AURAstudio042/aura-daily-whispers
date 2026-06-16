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
      ad_tarot_grants: {
        Row: {
          created_at: string
          id: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      aura_plus_trials: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          source: string
          starts_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          source: string
          starts_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          source?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bonus_tarot_credits: {
        Row: {
          consumed_at: string | null
          created_at: string
          id: string
          source: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          id?: string
          source: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      coffee_readings: {
        Row: {
          created_at: string
          id: string
          photo_url: string | null
          reading: string
          saved: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url?: string | null
          reading: string
          saved?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string | null
          reading?: string
          saved?: boolean
          user_id?: string
        }
        Relationships: []
      }
      daily_content: {
        Row: {
          content: Json
          created_at: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          date: string
          id?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      future_letters: {
        Row: {
          answers: Json
          created_at: string
          deliver_at: string
          id: string
          letter: string
          opened_at: string | null
          user_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          deliver_at: string
          id?: string
          letter: string
          opened_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          deliver_at?: string
          id?: string
          letter?: string
          opened_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      monthly_analyses: {
        Row: {
          content: Json
          created_at: string
          id: string
          month: number
          user_id: string
          year: number
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          month: number
          user_id: string
          year: number
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          month?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      mystic_pool: {
        Row: {
          active: boolean
          body: string
          category: string | null
          created_at: string
          id: string
          title: string
        }
        Insert: {
          active?: boolean
          body: string
          category?: string | null
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          active?: boolean
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          id: number
          route: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: number
          route: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: number
          route?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      premium_grants: {
        Row: {
          created_at: string
          ends_at: string
          granted_by: string | null
          id: string
          note: string | null
          starts_at: string
          tier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          granted_by?: string | null
          id?: string
          note?: string | null
          starts_at?: string
          tier: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          granted_by?: string | null
          id?: string
          note?: string | null
          starts_at?: string
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          birth_time: string | null
          city: string | null
          created_at: string
          gender: string | null
          hair_color: string | null
          has_children: boolean | null
          has_pets: boolean | null
          id: string
          life_focus: string[]
          name: string | null
          notification_time: string
          relationship_status: string | null
          skin_tone: string | null
          style_type: string | null
          tier: string
          updated_at: string
          zodiac_sign: string | null
        }
        Insert: {
          birth_date?: string | null
          birth_time?: string | null
          city?: string | null
          created_at?: string
          gender?: string | null
          hair_color?: string | null
          has_children?: boolean | null
          has_pets?: boolean | null
          id: string
          life_focus?: string[]
          name?: string | null
          notification_time?: string
          relationship_status?: string | null
          skin_tone?: string | null
          style_type?: string | null
          tier?: string
          updated_at?: string
          zodiac_sign?: string | null
        }
        Update: {
          birth_date?: string | null
          birth_time?: string | null
          city?: string | null
          created_at?: string
          gender?: string | null
          hair_color?: string | null
          has_children?: boolean | null
          has_pets?: boolean | null
          id?: string
          life_focus?: string[]
          name?: string | null
          notification_time?: string
          relationship_status?: string | null
          skin_tone?: string | null
          style_type?: string | null
          tier?: string
          updated_at?: string
          zodiac_sign?: string | null
        }
        Relationships: []
      }
      quotes_pool: {
        Row: {
          active: boolean
          author: string | null
          created_at: string
          id: string
          tags: string[] | null
          text: string
        }
        Insert: {
          active?: boolean
          author?: string | null
          created_at?: string
          id?: string
          tags?: string[] | null
          text: string
        }
        Update: {
          active?: boolean
          author?: string | null
          created_at?: string
          id?: string
          tags?: string[] | null
          text?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
          rewarded_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
          rewarded_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
          rewarded_at?: string | null
        }
        Relationships: []
      }
      saved_quotes: {
        Row: {
          id: string
          quote_author: string | null
          quote_text: string
          saved_at: string
          user_id: string
        }
        Insert: {
          id?: string
          quote_author?: string | null
          quote_text: string
          saved_at?: string
          user_id: string
        }
        Update: {
          id?: string
          quote_author?: string | null
          quote_text?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: []
      }
      share_events: {
        Row: {
          created_at: string
          id: number
          kind: string
          ref_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          kind: string
          ref_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          kind?: string
          ref_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      special_day_messages: {
        Row: {
          created_at: string
          day: number
          id: string
          label: string
          message: string
          month: number
        }
        Insert: {
          created_at?: string
          day: number
          id?: string
          label: string
          message: string
          month: number
        }
        Update: {
          created_at?: string
          day?: number
          id?: string
          label?: string
          message?: string
          month?: number
        }
        Relationships: []
      }
      tarot_readings: {
        Row: {
          card_meaning: string
          card_name: string
          category: string
          created_at: string
          id: string
          interpretation: string
          user_id: string
        }
        Insert: {
          card_meaning: string
          card_name: string
          category: string
          created_at?: string
          id?: string
          interpretation: string
          user_id: string
        }
        Update: {
          card_meaning?: string
          card_name?: string
          category?: string
          created_at?: string
          id?: string
          interpretation?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whispers_pool: {
        Row: {
          active: boolean
          created_at: string
          id: string
          text: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          text: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          text?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
