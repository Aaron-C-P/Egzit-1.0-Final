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
      bookings: {
        Row: {
          created_at: string
          final_price: number | null
          id: string
          move_id: string | null
          mover_id: string | null
          notes: string | null
          payment_intent_id: string | null
          payment_status: string | null
          quoted_price: number | null
          scheduled_date: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          final_price?: number | null
          id?: string
          move_id?: string | null
          mover_id?: string | null
          notes?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          quoted_price?: number | null
          scheduled_date?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          final_price?: number | null
          id?: string
          move_id?: string | null
          mover_id?: string | null
          notes?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          quoted_price?: number | null
          scheduled_date?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_move_id_fkey"
            columns: ["move_id"]
            isOneToOne: false
            referencedRelation: "moves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_mover_id_fkey"
            columns: ["mover_id"]
            isOneToOne: false
            referencedRelation: "movers"
            referencedColumns: ["id"]
          },
        ]
      }
      boxes: {
        Row: {
          box_size: string | null
          created_at: string
          current_weight: number | null
          dimensions: string | null
          id: string
          inventory_id: string | null
          is_fragile: boolean | null
          max_weight: number | null
          name: string
          notes: string | null
          qr_code: string | null
          room: string | null
          user_id: string
        }
        Insert: {
          box_size?: string | null
          created_at?: string
          current_weight?: number | null
          dimensions?: string | null
          id?: string
          inventory_id?: string | null
          is_fragile?: boolean | null
          max_weight?: number | null
          name: string
          notes?: string | null
          qr_code?: string | null
          room?: string | null
          user_id: string
        }
        Update: {
          box_size?: string | null
          created_at?: string
          current_weight?: number | null
          dimensions?: string | null
          id?: string
          inventory_id?: string | null
          is_fragile?: boolean | null
          max_weight?: number | null
          name?: string
          notes?: string | null
          qr_code?: string | null
          room?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boxes_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean | null
          message: string
          move_id: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          message: string
          move_id?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          message?: string
          move_id?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_move_id_fkey"
            columns: ["move_id"]
            isOneToOne: false
            referencedRelation: "moves"
            referencedColumns: ["id"]
          },
        ]
      }
      inventories: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          box_id: string | null
          category: string | null
          created_at: string | null
          fragile: boolean | null
          id: string
          image_url: string | null
          inventory_id: string | null
          meta: Json | null
          move_id: string | null
          name: string
          packed: boolean | null
          qr_code: string | null
          room: string | null
          weight: number | null
        }
        Insert: {
          box_id?: string | null
          category?: string | null
          created_at?: string | null
          fragile?: boolean | null
          id?: string
          image_url?: string | null
          inventory_id?: string | null
          meta?: Json | null
          move_id?: string | null
          name: string
          packed?: boolean | null
          qr_code?: string | null
          room?: string | null
          weight?: number | null
        }
        Update: {
          box_id?: string | null
          category?: string | null
          created_at?: string | null
          fragile?: boolean | null
          id?: string
          image_url?: string | null
          inventory_id?: string | null
          meta?: Json | null
          move_id?: string | null
          name?: string
          packed?: boolean | null
          qr_code?: string | null
          room?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_move_id_fkey"
            columns: ["move_id"]
            isOneToOne: false
            referencedRelation: "moves"
            referencedColumns: ["id"]
          },
        ]
      }
      move_performance: {
        Row: {
          actual_duration: number | null
          average_speed_kmh: number | null
          created_at: string | null
          delay_reasons: Json | null
          delays_count: number | null
          distance_km: number | null
          estimated_duration: number | null
          feedback: string | null
          id: string
          move_id: string
          on_time: boolean | null
          rating: number | null
        }
        Insert: {
          actual_duration?: number | null
          average_speed_kmh?: number | null
          created_at?: string | null
          delay_reasons?: Json | null
          delays_count?: number | null
          distance_km?: number | null
          estimated_duration?: number | null
          feedback?: string | null
          id?: string
          move_id: string
          on_time?: boolean | null
          rating?: number | null
        }
        Update: {
          actual_duration?: number | null
          average_speed_kmh?: number | null
          created_at?: string | null
          delay_reasons?: Json | null
          delays_count?: number | null
          distance_km?: number | null
          estimated_duration?: number | null
          feedback?: string | null
          id?: string
          move_id?: string
          on_time?: boolean | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "move_performance_move_id_fkey"
            columns: ["move_id"]
            isOneToOne: true
            referencedRelation: "moves"
            referencedColumns: ["id"]
          },
        ]
      }
      move_tracking_events: {
        Row: {
          created_by: string | null
          event_time: string
          event_type: string
          id: string
          location_lat: number | null
          location_lng: number | null
          metadata: Json | null
          move_id: string
          notes: string | null
        }
        Insert: {
          created_by?: string | null
          event_time?: string
          event_type: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          metadata?: Json | null
          move_id: string
          notes?: string | null
        }
        Update: {
          created_by?: string | null
          event_time?: string
          event_type?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          metadata?: Json | null
          move_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "move_tracking_events_move_id_fkey"
            columns: ["move_id"]
            isOneToOne: false
            referencedRelation: "moves"
            referencedColumns: ["id"]
          },
        ]
      }
      mover_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          mover_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          mover_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          mover_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mover_reviews_mover_id_fkey"
            columns: ["mover_id"]
            isOneToOne: false
            referencedRelation: "movers"
            referencedColumns: ["id"]
          },
        ]
      }
      mover_services: {
        Row: {
          created_at: string
          id: string
          mover_id: string
          service: string
        }
        Insert: {
          created_at?: string
          id?: string
          mover_id: string
          service: string
        }
        Update: {
          created_at?: string
          id?: string
          mover_id?: string
          service?: string
        }
        Relationships: [
          {
            foreignKeyName: "mover_services_mover_id_fkey"
            columns: ["mover_id"]
            isOneToOne: false
            referencedRelation: "movers"
            referencedColumns: ["id"]
          },
        ]
      }
      movers: {
        Row: {
          available: boolean | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          insured: boolean | null
          location: string | null
          logo_url: string | null
          min_price: number | null
          name: string
          phone: string | null
          price_range: string | null
          rating: number | null
          response_time: string | null
          review_count: number | null
          updated_at: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          available?: boolean | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          insured?: boolean | null
          location?: string | null
          logo_url?: string | null
          min_price?: number | null
          name: string
          phone?: string | null
          price_range?: string | null
          rating?: number | null
          response_time?: string | null
          review_count?: number | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          available?: boolean | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          insured?: boolean | null
          location?: string | null
          logo_url?: string | null
          min_price?: number | null
          name?: string
          phone?: string | null
          price_range?: string | null
          rating?: number | null
          response_time?: string | null
          review_count?: number | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      moves: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_mover_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          delivery_address: string | null
          estimated_arrival_time: string | null
          estimated_duration: number | null
          id: string
          inventory_id: string | null
          move_date: string | null
          name: string
          performance_data: Json | null
          pickup_address: string | null
          quote_id: string | null
          route_data: Json | null
          scheduled_time: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_mover_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          delivery_address?: string | null
          estimated_arrival_time?: string | null
          estimated_duration?: number | null
          id?: string
          inventory_id?: string | null
          move_date?: string | null
          name: string
          performance_data?: Json | null
          pickup_address?: string | null
          quote_id?: string | null
          route_data?: Json | null
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_mover_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          delivery_address?: string | null
          estimated_arrival_time?: string | null
          estimated_duration?: number | null
          id?: string
          inventory_id?: string | null
          move_date?: string | null
          name?: string
          performance_data?: Json | null
          pickup_address?: string | null
          quote_id?: string | null
          route_data?: Json | null
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moves_assigned_mover_id_fkey"
            columns: ["assigned_mover_id"]
            isOneToOne: false
            referencedRelation: "movers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moves_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moves_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          base_price: number
          created_at: string
          created_by: string | null
          distance_fee: number | null
          id: string
          insurance_fee: number | null
          move_id: string
          notes: string | null
          special_items_fee: number | null
          status: string | null
          tax: number | null
          total_price: number
          updated_at: string
          valid_until: string | null
          weight_fee: number | null
        }
        Insert: {
          base_price: number
          created_at?: string
          created_by?: string | null
          distance_fee?: number | null
          id?: string
          insurance_fee?: number | null
          move_id: string
          notes?: string | null
          special_items_fee?: number | null
          status?: string | null
          tax?: number | null
          total_price: number
          updated_at?: string
          valid_until?: string | null
          weight_fee?: number | null
        }
        Update: {
          base_price?: number
          created_at?: string
          created_by?: string | null
          distance_fee?: number | null
          id?: string
          insurance_fee?: number | null
          move_id?: string
          notes?: string | null
          special_items_fee?: number | null
          status?: string | null
          tax?: number | null
          total_price?: number
          updated_at?: string
          valid_until?: string | null
          weight_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_move_id_fkey"
            columns: ["move_id"]
            isOneToOne: false
            referencedRelation: "moves"
            referencedColumns: ["id"]
          },
        ]
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
