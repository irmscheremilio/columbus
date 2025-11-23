export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          domain: string
          industry: string | null
          tech_stack: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          industry?: string | null
          tech_stack?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          industry?: string | null
          tech_stack?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string | null
          email: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          organization_id?: string | null
          email: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          email?: string
          role?: string
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          organization_id: string
          stripe_subscription_id: string | null
          plan_type: string
          status: string
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          stripe_subscription_id?: string | null
          plan_type: string
          status: string
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          stripe_subscription_id?: string | null
          plan_type?: string
          status?: string
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          organization_id: string
          prompt_text: string
          category: string | null
          is_custom: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          prompt_text: string
          category?: string | null
          is_custom?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          prompt_text?: string
          category?: string | null
          is_custom?: boolean
          created_at?: string
        }
      }
      prompt_results: {
        Row: {
          id: string
          prompt_id: string
          organization_id: string
          ai_model: string
          response_text: string | null
          brand_mentioned: boolean | null
          citation_present: boolean | null
          position: number | null
          sentiment: string | null
          competitor_mentions: any | null
          metadata: any | null
          tested_at: string
          created_at: string
        }
        Insert: {
          id?: string
          prompt_id: string
          organization_id: string
          ai_model: string
          response_text?: string | null
          brand_mentioned?: boolean | null
          citation_present?: boolean | null
          position?: number | null
          sentiment?: string | null
          competitor_mentions?: any | null
          metadata?: any | null
          tested_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          prompt_id?: string
          organization_id?: string
          ai_model?: string
          response_text?: string | null
          brand_mentioned?: boolean | null
          citation_present?: boolean | null
          position?: number | null
          sentiment?: string | null
          competitor_mentions?: any | null
          metadata?: any | null
          tested_at?: string
          created_at?: string
        }
      }
      visibility_scores: {
        Row: {
          id: string
          organization_id: string
          score: number
          ai_model: string
          period_start: string
          period_end: string
          metrics: any | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          score: number
          ai_model: string
          period_start: string
          period_end: string
          metrics?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          score?: number
          ai_model?: string
          period_start?: string
          period_end?: string
          metrics?: any | null
          created_at?: string
        }
      }
      fix_recommendations: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string | null
          category: string
          priority: number
          estimated_impact: string
          implementation_guide: any | null
          status: string
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          description?: string | null
          category: string
          priority: number
          estimated_impact: string
          implementation_guide?: any | null
          status?: string
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          description?: string | null
          category?: string
          priority?: number
          estimated_impact?: string
          implementation_guide?: any | null
          status?: string
          created_at?: string
          completed_at?: string | null
        }
      }
      competitors: {
        Row: {
          id: string
          organization_id: string
          name: string
          domain: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          domain?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          domain?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          organization_id: string
          job_type: string
          status: string
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          job_type: string
          status?: string
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          metadata?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_type?: string
          status?: string
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          metadata?: any | null
          created_at?: string
        }
      }
      waitlist: {
        Row: {
          id: string
          email: string
          company_name: string | null
          website: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          company_name?: string | null
          website?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          company_name?: string | null
          website?: string | null
          created_at?: string
        }
      }
    }
  }
}
