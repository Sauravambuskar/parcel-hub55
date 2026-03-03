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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          base_fare: number | null
          courier_name: string
          courier_price: number
          created_at: string
          delivery_time: string
          goods_type: string
          gst: number | null
          height: string | null
          id: string
          insurance_amount: number | null
          insurance_required: boolean | null
          label_url: string | null
          length: string | null
          package_weight: string
          packaging_amount: number | null
          packaging_required: boolean | null
          payment_id: string | null
          payment_status: string | null
          platform_fee: number | null
          prayog_awb: string | null
          prayog_commission: number | null
          prayog_order_id: string | null
          receiver_address: string
          receiver_city: string
          receiver_name: string
          receiver_phone: string
          receiver_pincode: string
          receiver_state: string
          sender_address: string
          sender_city: string
          sender_name: string
          sender_phone: string
          sender_pincode: string
          sender_state: string
          shipment_value: number | null
          status: string | null
          tracking_id: string | null
          updated_at: string
          urgency: string
          user_id: string
          width: string | null
        }
        Insert: {
          base_fare?: number | null
          courier_name: string
          courier_price: number
          created_at?: string
          delivery_time: string
          goods_type: string
          gst?: number | null
          height?: string | null
          id?: string
          insurance_amount?: number | null
          insurance_required?: boolean | null
          label_url?: string | null
          length?: string | null
          package_weight: string
          packaging_amount?: number | null
          packaging_required?: boolean | null
          payment_id?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          prayog_awb?: string | null
          prayog_commission?: number | null
          prayog_order_id?: string | null
          receiver_address: string
          receiver_city: string
          receiver_name: string
          receiver_phone: string
          receiver_pincode: string
          receiver_state: string
          sender_address: string
          sender_city: string
          sender_name: string
          sender_phone: string
          sender_pincode: string
          sender_state: string
          shipment_value?: number | null
          status?: string | null
          tracking_id?: string | null
          updated_at?: string
          urgency: string
          user_id: string
          width?: string | null
        }
        Update: {
          base_fare?: number | null
          courier_name?: string
          courier_price?: number
          created_at?: string
          delivery_time?: string
          goods_type?: string
          gst?: number | null
          height?: string | null
          id?: string
          insurance_amount?: number | null
          insurance_required?: boolean | null
          label_url?: string | null
          length?: string | null
          package_weight?: string
          packaging_amount?: number | null
          packaging_required?: boolean | null
          payment_id?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          prayog_awb?: string | null
          prayog_commission?: number | null
          prayog_order_id?: string | null
          receiver_address?: string
          receiver_city?: string
          receiver_name?: string
          receiver_phone?: string
          receiver_pincode?: string
          receiver_state?: string
          sender_address?: string
          sender_city?: string
          sender_name?: string
          sender_phone?: string
          sender_pincode?: string
          sender_state?: string
          shipment_value?: number | null
          status?: string | null
          tracking_id?: string | null
          updated_at?: string
          urgency?: string
          user_id?: string
          width?: string | null
        }
        Relationships: []
      }
      partner_ratings: {
        Row: {
          badges: string[] | null
          cons: string[] | null
          created_at: string | null
          id: string
          last_fetched_at: string | null
          partner_code: string
          partner_name: string
          pros: string[] | null
          rating: number | null
          rating_source: string | null
          review_count: number | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          badges?: string[] | null
          cons?: string[] | null
          created_at?: string | null
          id?: string
          last_fetched_at?: string | null
          partner_code: string
          partner_name: string
          pros?: string[] | null
          rating?: number | null
          rating_source?: string | null
          review_count?: number | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          badges?: string[] | null
          cons?: string[] | null
          created_at?: string | null
          id?: string
          last_fetched_at?: string | null
          partner_code?: string
          partner_name?: string
          pros?: string[] | null
          rating?: number | null
          rating_source?: string | null
          review_count?: number | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          doc_number: string | null
          doc_type: string | null
          email: string | null
          full_name: string | null
          id: string
          kyc_completed_at: string | null
          kyc_status: string | null
          phone: string | null
          preferred_language: string | null
          promo_notifications: boolean | null
          sms_notifications: boolean | null
          status: string | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_number?: string | null
          doc_type?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          kyc_completed_at?: string | null
          kyc_status?: string | null
          phone?: string | null
          preferred_language?: string | null
          promo_notifications?: boolean | null
          sms_notifications?: boolean | null
          status?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_number?: string | null
          doc_type?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          kyc_completed_at?: string | null
          kyc_status?: string | null
          phone?: string | null
          preferred_language?: string | null
          promo_notifications?: boolean | null
          sms_notifications?: boolean | null
          status?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          address: string
          city: string
          created_at: string | null
          flat_no: string | null
          id: string
          label: string | null
          name: string
          phone: string
          pincode: string
          state: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          flat_no?: string | null
          id?: string
          label?: string | null
          name: string
          phone: string
          pincode: string
          state: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          flat_no?: string | null
          id?: string
          label?: string | null
          name?: string
          phone?: string
          pincode?: string
          state?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          booking_id: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          booking_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_type?: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_safe: {
        Row: {
          created_at: string | null
          doc_number: string | null
          doc_type: string | null
          email: string | null
          full_name: string | null
          id: string | null
          kyc_completed_at: string | null
          kyc_status: string | null
          phone: string | null
          preferred_language: string | null
          promo_notifications: boolean | null
          sms_notifications: boolean | null
          status: string | null
          theme_preference: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          doc_number?: never
          doc_type?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          kyc_completed_at?: string | null
          kyc_status?: string | null
          phone?: string | null
          preferred_language?: string | null
          promo_notifications?: boolean | null
          sms_notifications?: boolean | null
          status?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          doc_number?: never
          doc_type?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          kyc_completed_at?: string | null
          kyc_status?: string | null
          phone?: string | null
          preferred_language?: string | null
          promo_notifications?: boolean | null
          sms_notifications?: boolean | null
          status?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_admin_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      mask_doc_number: { Args: { doc: string }; Returns: string }
    }
    Enums: {
      admin_role: "super_admin" | "support"
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
      admin_role: ["super_admin", "support"],
    },
  },
} as const
