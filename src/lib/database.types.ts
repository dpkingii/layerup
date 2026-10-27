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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      allowlist: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          breathable: boolean
          category: string | null
          colors: string[]
          created_at: string
          id: string
          is_generic: boolean
          pattern: string | null
          photo_path: string | null
          slot: Database["public"]["Enums"]["item_slot"] | null
          subtype: string | null
          tag_status: Database["public"]["Enums"]["tag_status"]
          user_id: string
          warmth: number | null
          waterproof: boolean
          windproof: boolean
        }
        Insert: {
          breathable?: boolean
          category?: string | null
          colors?: string[]
          created_at?: string
          id?: string
          is_generic?: boolean
          pattern?: string | null
          photo_path?: string | null
          slot?: Database["public"]["Enums"]["item_slot"] | null
          subtype?: string | null
          tag_status?: Database["public"]["Enums"]["tag_status"]
          user_id?: string
          warmth?: number | null
          waterproof?: boolean
          windproof?: boolean
        }
        Update: {
          breathable?: boolean
          category?: string | null
          colors?: string[]
          created_at?: string
          id?: string
          is_generic?: boolean
          pattern?: string | null
          photo_path?: string | null
          slot?: Database["public"]["Enums"]["item_slot"] | null
          subtype?: string | null
          tag_status?: Database["public"]["Enums"]["tag_status"]
          user_id?: string
          warmth?: number | null
          waterproof?: boolean
          windproof?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          day_end: string
          day_start: string
          fit_pref: Database["public"]["Enums"]["fit_pref"] | null
          id: string
          location_lat: number | null
          location_lon: number | null
          location_name: string | null
          onboarded_at: string | null
          temp_sensitivity: Database["public"]["Enums"]["temp_sensitivity"]
          vibes: string[]
        }
        Insert: {
          created_at?: string
          day_end?: string
          day_start?: string
          fit_pref?: Database["public"]["Enums"]["fit_pref"] | null
          id: string
          location_lat?: number | null
          location_lon?: number | null
          location_name?: string | null
          onboarded_at?: string | null
          temp_sensitivity?: Database["public"]["Enums"]["temp_sensitivity"]
          vibes?: string[]
        }
        Update: {
          created_at?: string
          day_end?: string
          day_start?: string
          fit_pref?: Database["public"]["Enums"]["fit_pref"] | null
          id?: string
          location_lat?: number | null
          location_lon?: number | null
          location_name?: string | null
          onboarded_at?: string | null
          temp_sensitivity?: Database["public"]["Enums"]["temp_sensitivity"]
          vibes?: string[]
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          context: Database["public"]["Enums"]["day_context"]
          created_at: string
          feedback: string[] | null
          id: string
          outfit: Json
          rationale: string | null
          session_id: string
          user_id: string
          weather: Json
          worn_at: string | null
        }
        Insert: {
          context: Database["public"]["Enums"]["day_context"]
          created_at?: string
          feedback?: string[] | null
          id?: string
          outfit: Json
          rationale?: string | null
          session_id: string
          user_id?: string
          weather: Json
          worn_at?: string | null
        }
        Update: {
          context?: Database["public"]["Enums"]["day_context"]
          created_at?: string
          feedback?: string[] | null
          id?: string
          outfit?: Json
          rationale?: string | null
          session_id?: string
          user_id?: string
          weather?: Json
          worn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      day_context: "work" | "casual" | "active" | "going_out"
      fit_pref: "relaxed" | "fitted" | "oversized"
      item_slot:
        | "base"
        | "mid"
        | "outer"
        | "bottom"
        | "one_piece"
        | "shoes"
        | "accessory"
      tag_status: "pending" | "tagged" | "confirmed" | "failed"
      temp_sensitivity: "runs_cold" | "neutral" | "runs_hot"
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
    Enums: {
      day_context: ["work", "casual", "active", "going_out"],
      fit_pref: ["relaxed", "fitted", "oversized"],
      item_slot: [
        "base",
        "mid",
        "outer",
        "bottom",
        "one_piece",
        "shoes",
        "accessory",
      ],
      tag_status: ["pending", "tagged", "confirmed", "failed"],
      temp_sensitivity: ["runs_cold", "neutral", "runs_hot"],
    },
  },
} as const
