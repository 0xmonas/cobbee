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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          actor_id: string | null
          actor_type: string
          changes: Json | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          changes?: Json | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          changes?: Json | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      blacklisted_wallets: {
        Row: {
          ban_scope: string | null
          blacklisted_at: string | null
          blacklisted_by: string
          id: string
          notes: string | null
          reason: string
          wallet_address: string
        }
        Insert: {
          ban_scope?: string | null
          blacklisted_at?: string | null
          blacklisted_by: string
          id?: string
          notes?: string | null
          reason: string
          wallet_address: string
        }
        Update: {
          ban_scope?: string | null
          blacklisted_at?: string | null
          blacklisted_by?: string
          id?: string
          notes?: string | null
          reason?: string
          wallet_address?: string
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          token_type: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          token_type: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          token_type?: string
          used?: boolean | null
        }
        Relationships: []
      }
      supporter_wallets: {
        Row: {
          blacklist_reason: string | null
          blacklisted_at: string | null
          blacklisted_by: string | null
          created_at: string | null
          first_seen_at: string | null
          id: string
          is_blacklisted: boolean | null
          last_seen_at: string | null
          total_creators_supported: number | null
          total_support_count: number | null
          updated_at: string | null
          used_names: Json | null
          wallet_address: string
        }
        Insert: {
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          is_blacklisted?: boolean | null
          last_seen_at?: string | null
          total_creators_supported?: number | null
          total_support_count?: number | null
          updated_at?: string | null
          used_names?: Json | null
          wallet_address: string
        }
        Update: {
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          is_blacklisted?: boolean | null
          last_seen_at?: string | null
          total_creators_supported?: number | null
          total_support_count?: number | null
          updated_at?: string | null
          used_names?: Json | null
          wallet_address?: string
        }
        Relationships: []
      }
      supports: {
        Row: {
          chain_id: number
          coffee_count: number
          coffee_price_at_time: number
          confirmed_at: string | null
          created_at: string | null
          creator_id: string
          currency: string | null
          id: string
          is_hidden_by_creator: boolean | null
          is_message_private: boolean | null
          message: string | null
          status: string
          supporter_avatar_url: string | null
          supporter_name: string
          supporter_wallet_address: string
          total_amount: number
          tx_hash: string
        }
        Insert: {
          chain_id: number
          coffee_count: number
          coffee_price_at_time: number
          confirmed_at?: string | null
          created_at?: string | null
          creator_id: string
          currency?: string | null
          id?: string
          is_hidden_by_creator?: boolean | null
          is_message_private?: boolean | null
          message?: string | null
          status?: string
          supporter_avatar_url?: string | null
          supporter_name: string
          supporter_wallet_address: string
          total_amount: number
          tx_hash: string
        }
        Update: {
          chain_id?: number
          coffee_count?: number
          coffee_price_at_time?: number
          confirmed_at?: string | null
          created_at?: string | null
          creator_id?: string
          currency?: string | null
          id?: string
          is_hidden_by_creator?: boolean | null
          is_message_private?: boolean | null
          message?: string | null
          status?: string
          supporter_avatar_url?: string | null
          supporter_name?: string
          supporter_wallet_address?: string
          total_amount?: number
          tx_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "supports_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_dashboard_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supports_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "public_creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supports_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          coffee_price: number | null
          cover_image_url: string | null
          created_at: string | null
          display_name: string
          email: string | null
          email_notifications_new_support: boolean | null
          email_notifications_security: boolean | null
          email_verified: boolean | null
          github_handle: string | null
          id: string
          instagram_handle: string | null
          is_active: boolean | null
          opensea_handle: string | null
          thank_you_message: string | null
          tiktok_handle: string | null
          twitter_handle: string | null
          updated_at: string | null
          username: string
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          coffee_price?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name: string
          email?: string | null
          email_notifications_new_support?: boolean | null
          email_notifications_security?: boolean | null
          email_verified?: boolean | null
          github_handle?: string | null
          id: string
          instagram_handle?: string | null
          is_active?: boolean | null
          opensea_handle?: string | null
          thank_you_message?: string | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          username: string
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          coffee_price?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name?: string
          email?: string | null
          email_notifications_new_support?: boolean | null
          email_notifications_security?: boolean | null
          email_verified?: boolean | null
          github_handle?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean | null
          opensea_handle?: string | null
          thank_you_message?: string | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          username?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      creator_dashboard_stats: {
        Row: {
          display_name: string | null
          id: string | null
          monthly_earnings: number | null
          monthly_supports: number | null
          total_earnings: number | null
          total_supporters: number | null
          total_supports: number | null
          username: string | null
        }
        Relationships: []
      }
      public_creator_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          coffee_price: number | null
          cover_image_url: string | null
          created_at: string | null
          display_name: string | null
          github_handle: string | null
          id: string | null
          instagram_handle: string | null
          opensea_handle: string | null
          supporter_count: number | null
          tiktok_handle: string | null
          twitter_handle: string | null
          username: string | null
          wallet_address: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_audit_log: {
        Args: {
          p_actor_id: string
          p_actor_type: string
          p_changes?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_target_id?: string
          p_target_type?: string
          p_user_agent?: string
        }
        Returns: string
      }
      create_support: {
        Args: {
          p_chain_id: number
          p_coffee_count: number
          p_creator_username: string
          p_message: string
          p_supporter_name: string
          p_supporter_wallet: string
          p_tx_hash: string
        }
        Returns: Json
      }
      is_wallet_blacklisted: {
        Args: { p_wallet_address: string }
        Returns: boolean
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
