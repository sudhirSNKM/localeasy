export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          role: 'user' | 'admin' | 'super_admin';
          avatar_url: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string;
          role?: 'user' | 'admin' | 'super_admin';
          avatar_url?: string;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          phone?: string;
          role?: 'user' | 'admin' | 'super_admin';
          avatar_url?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          color: string;
          created_at: string;
        };
        Insert: { name: string; icon?: string; color?: string };
        Update: { name?: string; icon?: string; color?: string };
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string;
          category_id: string | null;
          address: string;
          city: string;
          phone: string;
          whatsapp: string;
          logo_url: string;
          cover_url: string;
          status: 'pending' | 'approved' | 'rejected';
          rating: number;
          review_count: number;
          created_at: string;
        };
        Insert: {
          owner_id: string;
          name: string;
          description?: string;
          category_id?: string | null;
          address?: string;
          city?: string;
          phone?: string;
          whatsapp?: string;
          logo_url?: string;
          cover_url?: string;
          status?: 'pending' | 'approved' | 'rejected';
        };
        Update: {
          name?: string;
          description?: string;
          category_id?: string | null;
          address?: string;
          city?: string;
          phone?: string;
          whatsapp?: string;
          logo_url?: string;
          cover_url?: string;
          status?: 'pending' | 'approved' | 'rejected';
        };
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string;
          price: number;
          duration: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          business_id: string;
          name: string;
          description?: string;
          price?: number;
          duration?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string;
          price?: number;
          duration?: number;
          is_active?: boolean;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          business_id: string;
          service_id: string;
          date: string;
          time_slot: string;
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          notes: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          business_id: string;
          service_id: string;
          date: string;
          time_slot: string;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          notes?: string;
        };
        Update: {
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          notes?: string;
        };
      };
      promotions: {
        Row: {
          id: string;
          business_id: string;
          title: string;
          description: string;
          discount_pct: number;
          start_date: string;
          end_date: string;
          image_url: string;
          status: 'active' | 'inactive';
          created_at: string;
        };
        Insert: {
          business_id: string;
          title: string;
          description?: string;
          discount_pct?: number;
          start_date: string;
          end_date: string;
          image_url?: string;
          status?: 'active' | 'inactive';
        };
        Update: {
          title?: string;
          description?: string;
          discount_pct?: number;
          start_date?: string;
          end_date?: string;
          image_url?: string;
          status?: 'active' | 'inactive';
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
