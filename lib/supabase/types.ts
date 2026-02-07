export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          user_id: string
          name: string
          vision: string | null
          purpose: string | null
          values: string | null
          beliefs: string | null
          narrative: string | null
          celebration_plan: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          vision?: string | null
          purpose?: string | null
          values?: string | null
          beliefs?: string | null
          narrative?: string | null
          celebration_plan?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          vision?: string | null
          purpose?: string | null
          values?: string | null
          beliefs?: string | null
          narrative?: string | null
          celebration_plan?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          department_id: string
          title: string
          description: string | null
          type: string
          status: string
          target_date: string | null
          kpi_metric: string | null
          kpi_start_value: number | null
          kpi_target_value: number | null
          kpi_current_value: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          department_id: string
          title: string
          description?: string | null
          type: string
          status?: string
          target_date?: string | null
          kpi_metric?: string | null
          kpi_start_value?: number | null
          kpi_target_value?: number | null
          kpi_current_value?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          department_id?: string
          title?: string
          description?: string | null
          type?: string
          status?: string
          target_date?: string | null
          kpi_metric?: string | null
          kpi_start_value?: number | null
          kpi_target_value?: number | null
          kpi_current_value?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          department_id: string | null
          goal_id: string | null
          name: string
          description: string | null
          status: string
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          department_id?: string | null
          goal_id?: string | null
          name: string
          description?: string | null
          status?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          department_id?: string | null
          goal_id?: string | null
          name?: string
          description?: string | null
          status?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          department_id: string | null
          project_id: string | null
          content: string
          source: string | null
          status: string
          urgency: number | null
          importance: number | null
          due_date: string | null
          agent_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          department_id?: string | null
          project_id?: string | null
          content: string
          source?: string | null
          status?: string
          urgency?: number | null
          importance?: number | null
          due_date?: string | null
          agent_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          department_id?: string | null
          project_id?: string | null
          content?: string
          source?: string | null
          status?: string
          urgency?: number | null
          importance?: number | null
          due_date?: string | null
          agent_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      routines: {
        Row: {
          id: string
          user_id: string
          department_id: string | null
          name: string
          description: string | null
          frequency_type: string
          frequency_value: string[] | null
          default_time: string | null
          duration_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          department_id?: string | null
          name: string
          description?: string | null
          frequency_type?: string
          frequency_value?: string[] | null
          default_time?: string | null
          duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          department_id?: string | null
          name?: string
          description?: string | null
          frequency_type?: string
          frequency_value?: string[] | null
          default_time?: string | null
          duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_plans: {
        Row: {
          id: string
          user_id: string
          date: string
          status: string
          plan_document_url: string | null
          review_document_url: string | null
          user_feedback: string | null
          agent_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          status?: string
          plan_document_url?: string | null
          review_document_url?: string | null
          user_feedback?: string | null
          agent_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          status?: string
          plan_document_url?: string | null
          review_document_url?: string | null
          user_feedback?: string | null
          agent_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      plan_items: {
        Row: {
          id: number
          user_id: string
          daily_plan_id: string
          start_time: string
          end_time: string
          item_type: string
          task_id: string | null
          routine_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          daily_plan_id: string
          start_time: string
          end_time: string
          item_type: string
          task_id?: string | null
          routine_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          daily_plan_id?: string
          start_time?: string
          end_time?: string
          item_type?: string
          task_id?: string | null
          routine_id?: string | null
          status?: string
          created_at?: string
        }
      }
      resources: {
        Row: {
          id: string
          user_id: string
          department_id: string | null
          project_id: string | null
          type: string
          title: string | null
          content: string | null
          storage_path: string | null
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          department_id?: string | null
          project_id?: string | null
          type: string
          title?: string | null
          content?: string | null
          storage_path?: string | null
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          department_id?: string | null
          project_id?: string | null
          type?: string
          title?: string | null
          content?: string | null
          storage_path?: string | null
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      correction_logs: {
        Row: {
          id: number
          user_id: string
          log_type: string
          original_input: string | null
          initial_ia_output: Json | null
          corrected_user_output: Json | null
          user_reason: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          log_type: string
          original_input?: string | null
          initial_ia_output?: Json | null
          corrected_user_output?: Json | null
          user_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          log_type?: string
          original_input?: string | null
          initial_ia_output?: Json | null
          corrected_user_output?: Json | null
          user_reason?: string | null
          created_at?: string
        }
      }
      integration_tokens: {
        Row: {
          id: string
          user_id: string
          service_name: string
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_name: string
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service_name?: string
          access_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      planning_reviews: {
        Row: {
          id: string
          user_id: string
          type: string
          period_start_date: string
          status: string
          summary_text: string | null
          document_url: string | null
          user_notes: string | null
          agent_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          period_start_date: string
          status?: string
          summary_text?: string | null
          document_url?: string | null
          user_notes?: string | null
          agent_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          period_start_date?: string
          status?: string
          summary_text?: string | null
          document_url?: string | null
          user_notes?: string | null
          agent_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
