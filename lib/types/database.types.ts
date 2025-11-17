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
      admin_wallets: {
        Row: {
          added_at: string
          added_by: string | null
          notes: string | null
          wallet_address: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          notes?: string | null
          wallet_address: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          notes?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          actor_id: string | null
          actor_type: string
          browser_name: string | null
          browser_version: string | null
          changes: Json | null
          created_at: string | null
          device_brand: string | null
          device_model: string | null
          device_type: string | null
          event_type: string
          geo_city: string | null
          geo_country: string | null
          geo_country_code: string | null
          geo_flag: string | null
          geo_latitude: number | null
          geo_longitude: number | null
          geo_region: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          os_name: string | null
          os_version: string | null
          session_id: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          browser_name?: string | null
          browser_version?: string | null
          changes?: Json | null
          created_at?: string | null
          device_brand?: string | null
          device_model?: string | null
          device_type?: string | null
          event_type: string
          geo_city?: string | null
          geo_country?: string | null
          geo_country_code?: string | null
          geo_flag?: string | null
          geo_latitude?: number | null
          geo_longitude?: number | null
          geo_region?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          os_name?: string | null
          os_version?: string | null
          session_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          browser_name?: string | null
          browser_version?: string | null
          changes?: Json | null
          created_at?: string | null
          device_brand?: string | null
          device_model?: string | null
          device_type?: string | null
          event_type?: string
          geo_city?: string | null
          geo_country?: string | null
          geo_country_code?: string | null
          geo_flag?: string | null
          geo_latitude?: number | null
          geo_longitude?: number | null
          geo_region?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          os_name?: string | null
          os_version?: string | null
          session_id?: string | null
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
      email_verifications: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp_code: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          otp_code: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          related_support_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          related_support_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          related_support_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_support_id_fkey"
            columns: ["related_support_id"]
            isOneToOne: false
            referencedRelation: "admin_failed_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_support_id_fkey"
            columns: ["related_support_id"]
            isOneToOne: false
            referencedRelation: "supports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_top_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "creator_dashboard_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "admin_top_creators"
            referencedColumns: ["id"]
          },
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
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
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
          is_blocked: boolean
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
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
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
          is_blocked?: boolean
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
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
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
          is_blocked?: boolean
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
      admin_failed_payments: {
        Row: {
          chain_id: number | null
          coffee_count: number | null
          created_at: string | null
          creator_display_name: string | null
          creator_id: string | null
          creator_username: string | null
          id: string | null
          message: string | null
          supporter_name: string | null
          supporter_wallet_address: string | null
          total_amount: number | null
          tx_hash: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supports_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "admin_top_creators"
            referencedColumns: ["id"]
          },
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
      admin_platform_stats: {
        Row: {
          new_creators_last_30_days: number | null
          new_creators_last_7_days: number | null
          notifications_sent_24h: number | null
          signups_last_24h: number | null
          supports_last_24h: number | null
          total_active_creators: number | null
          total_blacklisted_wallets: number | null
          total_confirmed_supports: number | null
          total_failed_supports: number | null
          total_flagged_wallets: number | null
          total_inactive_creators: number | null
          total_pending_supports: number | null
          total_platform_volume_usd: number | null
          total_unique_supporters: number | null
          total_unread_notifications: number | null
          volume_last_24h: number | null
        }
        Relationships: []
      }
      admin_recent_activity: {
        Row: {
          actor_display_name: string | null
          actor_id: string | null
          actor_type: string | null
          actor_username: string | null
          browser_name: string | null
          browser_version: string | null
          changes: Json | null
          created_at: string | null
          device_brand: string | null
          device_model: string | null
          device_type: string | null
          event_type: string | null
          geo_city: string | null
          geo_country: string | null
          geo_country_code: string | null
          geo_flag: string | null
          geo_latitude: number | null
          geo_longitude: number | null
          geo_region: string | null
          id: string | null
          ip_address: unknown
          metadata: Json | null
          os_name: string | null
          os_version: string | null
          session_id: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Relationships: []
      }
      admin_suspicious_wallets: {
        Row: {
          blacklist_reason: string | null
          creators_last_7_days: number | null
          first_seen_at: string | null
          fraud_risk_score: number | null
          id: string | null
          is_blacklisted: boolean | null
          last_seen_at: string | null
          name_variation_count: number | null
          supports_last_7_days: number | null
          total_creators_supported: number | null
          total_support_count: number | null
          used_names: Json | null
          volume_last_7_days: number | null
          wallet_address: string | null
        }
        Relationships: []
      }
      admin_top_creators: {
        Row: {
          blocked_at: string | null
          blocked_reason: string | null
          coffee_price: number | null
          created_at: string | null
          display_name: string | null
          earnings_last_30_days: number | null
          email: string | null
          id: string | null
          is_active: boolean | null
          is_blocked: boolean | null
          last_support_at: string | null
          supports_last_30_days: number | null
          total_earnings: number | null
          total_supporters: number | null
          total_supports: number | null
          username: string | null
          wallet_address: string | null
        }
        Relationships: []
      }
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
      add_admin_wallet: {
        Args: { p_notes?: string; p_wallet_address: string }
        Returns: boolean
      }
      admin_blacklist_wallet: {
        Args: {
          p_admin_wallet?: string
          p_ban_scope?: string
          p_notes?: string
          p_reason: string
          p_wallet_address: string
        }
        Returns: Json
      }
      admin_block_user: {
        Args: { p_admin_id: string; p_reason?: string; p_user_id: string }
        Returns: Json
      }
      admin_get_analytics: {
        Args: { p_days?: number }
        Returns: {
          date: string
          new_creators: number
          new_supports: number
          total_volume: number
          unique_supporters: number
        }[]
      }
      admin_search_users: {
        Args: { p_limit?: number; p_search_term: string }
        Returns: {
          blocked_at: string
          blocked_reason: string
          created_at: string
          display_name: string
          email: string
          id: string
          is_active: boolean
          is_blocked: boolean
          total_earnings: number
          total_supporters: number
          username: string
          wallet_address: string
        }[]
      }
      admin_unblacklist_wallet: {
        Args: { p_admin_wallet?: string; p_wallet_address: string }
        Returns: Json
      }
      admin_unblock_user: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: Json
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      clear_all_notifications: { Args: never; Returns: number }
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
      create_notification: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_related_support_id?: string
          p_title: string
          p_type: string
          p_user_id: string
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
      delete_notification: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      get_unread_notification_count: { Args: never; Returns: number }
      is_admin_user: { Args: never; Returns: boolean }
      is_wallet_blacklisted: {
        Args: { p_wallet_address: string }
        Returns: boolean
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      remove_admin_wallet: {
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
