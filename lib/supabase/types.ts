// Generated via the Supabase MCP `generate_typescript_types` tool against the
// live "LEVER CRM" project (dvscivtzmquwwmzhetgh). Regenerate after schema changes.
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
      announcements: {
        Row: {
          author_member_id: string | null
          author_staff_id: string | null
          body: string
          created_at: string
          edited_at: string | null
          gym_id: string
          id: string
          photo_url: string | null
          pinned: boolean
          title: string | null
          type: string
        }
        Insert: {
          author_member_id?: string | null
          author_staff_id?: string | null
          body: string
          created_at?: string
          edited_at?: string | null
          gym_id: string
          id?: string
          photo_url?: string | null
          pinned?: boolean
          title?: string | null
          type?: string
        }
        Update: {
          author_member_id?: string | null
          author_staff_id?: string | null
          body?: string
          created_at?: string
          edited_at?: string | null
          gym_id?: string
          id?: string
          photo_url?: string | null
          pinned?: boolean
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_member_id_fkey"
            columns: ["author_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_author_staff_id_fkey"
            columns: ["author_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          end_at: string
          gym_id: string
          id: string
          member_id: string
          staff_id: string
          start_at: string
          status: string
        }
        Insert: {
          created_at?: string
          end_at: string
          gym_id: string
          id?: string
          member_id: string
          staff_id: string
          start_at: string
          status?: string
        }
        Update: {
          created_at?: string
          end_at?: string
          gym_id?: string
          id?: string
          member_id?: string
          staff_id?: string
          start_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          checked_in_at: string
          checked_in_by: string
          gym_id: string
          id: string
          member_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_in_by: string
          gym_id: string
          id?: string
          member_id: string
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string
          gym_id?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      class_bookings: {
        Row: {
          class_id: string
          created_at: string
          gym_id: string
          id: string
          member_id: string
          status: string
          waitlist_position: number | null
        }
        Insert: {
          class_id: string
          created_at?: string
          gym_id: string
          id?: string
          member_id: string
          status?: string
          waitlist_position?: number | null
        }
        Update: {
          class_id?: string
          created_at?: string
          gym_id?: string
          id?: string
          member_id?: string
          status?: string
          waitlist_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "class_bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          end_at: string
          gym_id: string
          id: string
          instructor_staff_id: string | null
          name: string
          start_at: string
          waitlist_enabled: boolean
        }
        Insert: {
          capacity: number
          created_at?: string
          description?: string | null
          end_at: string
          gym_id: string
          id?: string
          instructor_staff_id?: string | null
          name: string
          start_at: string
          waitlist_enabled?: boolean
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          end_at?: string
          gym_id?: string
          id?: string
          instructor_staff_id?: string | null
          name?: string
          start_at?: string
          waitlist_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "classes_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_instructor_staff_id_fkey"
            columns: ["instructor_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      email_automation_settings: {
        Row: {
          birthday_enabled: boolean
          class_reminder_enabled: boolean
          gym_id: string
          reengagement_enabled: boolean
          updated_at: string
        }
        Insert: {
          birthday_enabled?: boolean
          class_reminder_enabled?: boolean
          gym_id: string
          reengagement_enabled?: boolean
          updated_at?: string
        }
        Update: {
          birthday_enabled?: boolean
          class_reminder_enabled?: boolean
          gym_id?: string
          reengagement_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_automation_settings_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: true
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          gym_id: string
          id: string
          member_id: string
          related_id: string | null
          sent_at: string
          type: string
        }
        Insert: {
          gym_id: string
          id?: string
          member_id: string
          related_id?: string | null
          sent_at?: string
          type: string
        }
        Update: {
          gym_id?: string
          id?: string
          member_id?: string
          related_id?: string | null
          sent_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_branding: {
        Row: {
          gym_id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          gym_id: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          gym_id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_branding_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: true
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_levels: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "gym_levels_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          admin_pin_hash: string | null
          created_at: string
          grace_period_ends_at: string | null
          id: string
          name: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          tier_flags: Json
        }
        Insert: {
          admin_pin_hash?: string | null
          created_at?: string
          grace_period_ends_at?: string | null
          id?: string
          name: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          tier_flags?: Json
        }
        Update: {
          admin_pin_hash?: string | null
          created_at?: string
          grace_period_ends_at?: string | null
          id?: string
          name?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          tier_flags?: Json
        }
        Relationships: []
      }
      instructor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          gym_id: string
          id: string
          staff_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          gym_id: string
          id?: string
          staff_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          gym_id?: string
          id?: string
          staff_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_availability_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_blocks: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          gym_id: string
          id: string
          reason: string | null
          staff_id: string
          start_time: string | null
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          gym_id: string
          id?: string
          reason?: string | null
          staff_id: string
          start_time?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          gym_id?: string
          id?: string
          reason?: string | null
          staff_id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_blocks_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_blocks_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      member_documents: {
        Row: {
          created_at: string
          created_by: string | null
          gym_id: string
          id: string
          member_id: string
          signature_data_url: string | null
          signed_at: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          gym_id: string
          id?: string
          member_id: string
          signature_data_url?: string | null
          signed_at?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          gym_id?: string
          id?: string
          member_id?: string
          signature_data_url?: string | null
          signed_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_documents_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_documents_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          gym_id: string
          id: string
          level_id: string | null
          parent_member_id: string | null
          phone: string | null
          profile_picture_url: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          gym_id: string
          id: string
          level_id?: string | null
          parent_member_id?: string | null
          phone?: string | null
          profile_picture_url?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          gym_id?: string
          id?: string
          level_id?: string | null
          parent_member_id?: string | null
          phone?: string | null
          profile_picture_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "gym_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_parent_member_id_fkey"
            columns: ["parent_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      message_participants: {
        Row: {
          member_id: string | null
          staff_id: string | null
          thread_id: string
        }
        Insert: {
          member_id?: string | null
          staff_id?: string | null
          thread_id: string
        }
        Update: {
          member_id?: string | null
          staff_id?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_participants_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_participants_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          last_message_at: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          last_message_at?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          last_message_at?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          gym_id: string
          id: string
          sender_staff_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          gym_id: string
          id?: string
          sender_staff_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          gym_id?: string
          id?: string
          sender_staff_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_staff_id_fkey"
            columns: ["sender_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_staff_id: string
          body: string
          created_at: string
          gym_id: string
          id: string
          member_id: string | null
          pinned: boolean
        }
        Insert: {
          author_staff_id: string
          body: string
          created_at?: string
          gym_id: string
          id?: string
          member_id?: string | null
          pinned?: boolean
        }
        Update: {
          author_staff_id?: string
          body?: string
          created_at?: string
          gym_id?: string
          id?: string
          member_id?: string | null
          pinned?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notes_author_staff_id_fkey"
            columns: ["author_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          member_id: string | null
          message: string
          read_at: string | null
          related_id: string | null
          staff_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          member_id?: string | null
          message: string
          read_at?: string | null
          related_id?: string | null
          staff_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          member_id?: string | null
          message?: string
          read_at?: string | null
          related_id?: string | null
          staff_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      product_orders: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          member_id: string
          product_id: string
          quantity: number
          status: string
          total_cents: number
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          member_id: string
          product_id: string
          quantity: number
          status?: string
          total_cents: number
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          member_id?: string
          product_id?: string
          quantity?: number
          status?: string
          total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_orders_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_orders_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          gym_id: string
          id: string
          image_url: string | null
          name: string
          price_cents: number
          product_type: string
          stock_count: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          gym_id: string
          id?: string
          image_url?: string | null
          name: string
          price_cents: number
          product_type?: string
          stock_count?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          gym_id?: string
          id?: string
          image_url?: string | null
          name?: string
          price_cents?: number
          product_type?: string
          stock_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string
          description: string | null
          gym_id: string
          highlights: Json
          id: string
          level_tags: Json
          name: string
          sort_order: number
          tagline: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          gym_id: string
          highlights?: Json
          id?: string
          level_tags?: Json
          name: string
          sort_order?: number
          tagline?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          gym_id?: string
          highlights?: Json
          id?: string
          level_tags?: Json
          name?: string
          sort_order?: number
          tagline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          applecash_handle: string | null
          cashapp_handle: string | null
          created_at: string
          email: string
          full_name: string
          gym_id: string
          id: string
          role: string
          venmo_handle: string | null
          zelle_handle: string | null
        }
        Insert: {
          applecash_handle?: string | null
          cashapp_handle?: string | null
          created_at?: string
          email: string
          full_name: string
          gym_id: string
          id: string
          role: string
          venmo_handle?: string | null
          zelle_handle?: string | null
        }
        Update: {
          applecash_handle?: string | null
          cashapp_handle?: string | null
          created_at?: string
          email?: string
          full_name?: string
          gym_id?: string
          id?: string
          role?: string
          venmo_handle?: string | null
          zelle_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      member_checkin_stats: {
        Row: {
          gym_id: string | null
          lifetime_count: number | null
          member_id: string | null
          monthly_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      complete_gym_owner_signup: {
        Args: { p_gym_name: string; p_gym_slug: string; p_owner_name: string }
        Returns: string
      }
      complete_member_signup: {
        Args: { p_full_name: string; p_gym_slug: string }
        Returns: string
      }
      current_gym_id: { Args: never; Returns: string }
      current_staff_role: { Args: never; Returns: string }
      get_class_attendees: {
        Args: { p_class_id: string }
        Returns: {
          full_name: string
          member_id: string
        }[]
      }
      gym_has_feature: {
        Args: { p_feature: string; p_gym_id: string }
        Returns: boolean
      }
      has_admin_pin: { Args: never; Returns: boolean }
      is_current_member: { Args: never; Returns: boolean }
      is_gym_slug_available: { Args: { p_slug: string }; Returns: boolean }
      is_thread_participant: { Args: { p_thread_id: string }; Returns: boolean }
      set_admin_pin: { Args: { p_pin: string }; Returns: undefined }
      sweep_expired_grace_periods: { Args: never; Returns: undefined }
      verify_admin_pin: { Args: { p_pin: string }; Returns: boolean }
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
