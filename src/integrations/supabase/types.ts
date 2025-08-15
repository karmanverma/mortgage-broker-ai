export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action_type: string
          client_id: string | null
          created_at: string
          description: string
          document_id: string | null
          id: string
          lender_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          client_id?: string | null
          created_at?: string
          description: string
          document_id?: string | null
          id?: string
          lender_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          client_id?: string | null
          created_at?: string
          description?: string
          document_id?: string | null
          id?: string
          lender_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_people: {
        Row: {
          client_id: string
          contact_preference: string | null
          created_at: string
          id: string
          is_authorized_contact: boolean | null
          is_primary: boolean | null
          person_id: string
          relationship_notes: string | null
          relationship_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          contact_preference?: string | null
          created_at?: string
          id?: string
          is_authorized_contact?: boolean | null
          is_primary?: boolean | null
          person_id: string
          relationship_notes?: string | null
          relationship_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          contact_preference?: string | null
          created_at?: string
          id?: string
          is_authorized_contact?: boolean | null
          is_primary?: boolean | null
          person_id?: string
          relationship_notes?: string | null
          relationship_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_people_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          annual_income: number | null
          annual_revenue: number | null
          assets: Json | null
          assigned_loan_officer_id: string | null
          business_credit_score: number | null
          business_dba: string | null
          business_license_number: string | null
          business_net_worth: number | null
          business_type: string | null
          cash_flow_metrics: Json | null
          client_acquisition_source: string | null
          client_number: string | null
          client_status: string | null
          client_type: string | null
          communication_timezone: string | null
          created_at: string
          credit_score: number | null
          date_of_birth: string | null
          debt_service_coverage_ratio: number | null
          debt_to_income_ratio: number | null
          dependents_count: number | null
          employer_name: string | null
          employment_status: string | null
          first_time_buyer: boolean | null
          housing_situation: string | null
          id: string
          industry_classification: string | null
          job_title: string | null
          last_contact_date: string | null
          liabilities: Json | null
          marital_status: string | null
          people_id: string
          preferred_lender_types: string[] | null
          primary_contact_id: string | null
          referral_source: string | null
          risk_profile: string | null
          status: string | null
          tax_id_ein: string | null
          updated_at: string
          user_id: string
          veteran_status: boolean | null
          years_in_business: number | null
        }
        Insert: {
          annual_income?: number | null
          annual_revenue?: number | null
          assets?: Json | null
          assigned_loan_officer_id?: string | null
          business_credit_score?: number | null
          business_dba?: string | null
          business_license_number?: string | null
          business_net_worth?: number | null
          business_type?: string | null
          cash_flow_metrics?: Json | null
          client_acquisition_source?: string | null
          client_number?: string | null
          client_status?: string | null
          client_type?: string | null
          communication_timezone?: string | null
          created_at?: string
          credit_score?: number | null
          date_of_birth?: string | null
          debt_service_coverage_ratio?: number | null
          debt_to_income_ratio?: number | null
          dependents_count?: number | null
          employer_name?: string | null
          employment_status?: string | null
          first_time_buyer?: boolean | null
          housing_situation?: string | null
          id?: string
          industry_classification?: string | null
          job_title?: string | null
          last_contact_date?: string | null
          liabilities?: Json | null
          marital_status?: string | null
          people_id: string
          preferred_lender_types?: string[] | null
          primary_contact_id?: string | null
          referral_source?: string | null
          risk_profile?: string | null
          status?: string | null
          tax_id_ein?: string | null
          updated_at?: string
          user_id: string
          veteran_status?: boolean | null
          years_in_business?: number | null
        }
        Update: {
          annual_income?: number | null
          annual_revenue?: number | null
          assets?: Json | null
          assigned_loan_officer_id?: string | null
          business_credit_score?: number | null
          business_dba?: string | null
          business_license_number?: string | null
          business_net_worth?: number | null
          business_type?: string | null
          cash_flow_metrics?: Json | null
          client_acquisition_source?: string | null
          client_number?: string | null
          client_status?: string | null
          client_type?: string | null
          communication_timezone?: string | null
          created_at?: string
          credit_score?: number | null
          date_of_birth?: string | null
          debt_service_coverage_ratio?: number | null
          debt_to_income_ratio?: number | null
          dependents_count?: number | null
          employer_name?: string | null
          employment_status?: string | null
          first_time_buyer?: boolean | null
          housing_situation?: string | null
          id?: string
          industry_classification?: string | null
          job_title?: string | null
          last_contact_date?: string | null
          liabilities?: Json | null
          marital_status?: string | null
          people_id?: string
          preferred_lender_types?: string[] | null
          primary_contact_id?: string | null
          referral_source?: string | null
          risk_profile?: string | null
          status?: string | null
          tax_id_ein?: string | null
          updated_at?: string
          user_id?: string
          veteran_status?: boolean | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_people_id_fkey"
            columns: ["people_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: number
          message: string
          sender: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          message: string
          sender: string
          session_id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          message?: string
          sender?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          ai_extracted_data: Json | null
          client_id: string | null
          compliance_required: boolean | null
          content: string | null
          created_at: string
          description: string | null
          document_category: string | null
          document_status: string | null
          document_type: string | null
          embeddings: string | null
          expiration_date: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          lender_id: string | null
          loan_id: string | null
          meta_data: Json | null
          name: string
          notes: string | null
          storage_path: string | null
          updated_at: string
          uploaded_by: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          ai_extracted_data?: Json | null
          client_id?: string | null
          compliance_required?: boolean | null
          content?: string | null
          created_at?: string
          description?: string | null
          document_category?: string | null
          document_status?: string | null
          document_type?: string | null
          embeddings?: string | null
          expiration_date?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          lender_id?: string | null
          loan_id?: string | null
          meta_data?: Json | null
          name: string
          notes?: string | null
          storage_path?: string | null
          updated_at?: string
          uploaded_by?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          ai_extracted_data?: Json | null
          client_id?: string | null
          compliance_required?: boolean | null
          content?: string | null
          created_at?: string
          description?: string | null
          document_category?: string | null
          document_status?: string | null
          document_type?: string | null
          embeddings?: string | null
          expiration_date?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          lender_id?: string | null
          loan_id?: string | null
          meta_data?: Json | null
          name?: string
          notes?: string | null
          storage_path?: string | null
          updated_at?: string
          uploaded_by?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }  
    lender_people: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          lender_id: string
          person_id: string
          relationship_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          lender_id: string
          person_id: string
          relationship_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          lender_id?: string
          person_id?: string
          relationship_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lender_people_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      lenders: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          people_id: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          people_id: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          people_id?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lenders_people_id_fkey"
            columns: ["people_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          application_date: string | null
          approval_date: string | null
          client_id: string | null
          closing_date: string | null
          commission_amount: number | null
          compliance_status: string | null
          conditions_outstanding: string[] | null
          created_at: string | null
          debt_to_income_ratio: number | null
          down_payment: number | null
          estimated_closing_date: string | null
          funding_date: string | null
          id: string
          interest_rate: number | null
          lender_id: string | null
          loan_amount: number | null
          loan_number: string | null
          loan_officer_assigned: string | null
          loan_purpose: string
          loan_status: string
          loan_term: number | null
          loan_to_value_ratio: number | null
          loan_type: string
          monthly_payment: number | null
          notes: string | null
          opportunity_id: string | null
          priority_level: string | null
          processor_assigned: string | null
          profit_margin: number | null
          property_address: string | null
          property_value: number | null
          rate_lock_date: string | null
          rate_lock_expiration: string | null
          realtor_id: string | null
          underwriter_assigned: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_date?: string | null
          approval_date?: string | null
          client_id?: string | null
          closing_date?: string | null
          commission_amount?: number | null
          compliance_status?: string | null
          conditions_outstanding?: string[] | null
          created_at?: string | null
          debt_to_income_ratio?: number | null
          down_payment?: number | null
          estimated_closing_date?: string | null
          funding_date?: string | null
          id?: string
          interest_rate?: number | null
          lender_id?: string | null
          loan_amount?: number | null
          loan_number?: string | null
          loan_officer_assigned?: string | null
          loan_purpose: string
          loan_status?: string
          loan_term?: number | null
          loan_to_value_ratio?: number | null
          loan_type: string
          monthly_payment?: number | null
          notes?: string | null
          opportunity_id?: string | null
          priority_level?: string | null
          processor_assigned?: string | null
          profit_margin?: number | null
          property_address?: string | null
          property_value?: number | null
          rate_lock_date?: string | null
          rate_lock_expiration?: string | null
          realtor_id?: string | null
          underwriter_assigned?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_date?: string | null
          approval_date?: string | null
          client_id?: string | null
          closing_date?: string | null
          commission_amount?: number | null
          compliance_status?: string | null
          conditions_outstanding?: string[] | null
          created_at?: string | null
          debt_to_income_ratio?: number | null
          down_payment?: number | null
          estimated_closing_date?: string | null
          funding_date?: string | null
          id?: string
          interest_rate?: number | null
          lender_id?: string | null
          loan_amount?: number | null
          loan_number?: string | null
          loan_officer_assigned?: string | null
          loan_purpose?: string
          loan_status?: string
          loan_term?: number | null
          loan_to_value_ratio?: number | null
          loan_type?: string
          monthly_payment?: number | null
          notes?: string | null
          opportunity_id?: string | null
          priority_level?: string | null
          processor_assigned?: string | null
          profit_margin?: number | null
          property_address?: string | null
          property_value?: number | null
          rate_lock_date?: string | null
          rate_lock_expiration?: string | null
          realtor_id?: string | null
          underwriter_assigned?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_realtor_id_fkey"
            columns: ["realtor_id"]
            isOneToOne: false
            referencedRelation: "realtors"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          read: boolean
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          read?: boolean
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          assigned_loan_officer: string | null
          client_id: string | null
          created_at: string | null
          date_created: string | null
          date_modified: string | null
          estimated_loan_amount: number | null
          expected_close_date: string | null
          id: string
          last_activity_date: string | null
          lead_score: number | null
          lead_source: string | null
          marketing_campaign_id: string | null
          notes: string | null
          opportunity_type: string
          people_id: string
          probability_percentage: number | null
          property_address: string | null
          property_type: string | null
          referral_fee_expected: number | null
          stage: string
          updated_at: string | null
          urgency_level: string | null
          user_id: string
        }
        Insert: {
          assigned_loan_officer?: string | null
          client_id?: string | null
          created_at?: string | null
          date_created?: string | null
          date_modified?: string | null
          estimated_loan_amount?: number | null
          expected_close_date?: string | null
          id?: string
          last_activity_date?: string | null
          lead_score?: number | null
          lead_source?: string | null
          marketing_campaign_id?: string | null
          notes?: string | null
          opportunity_type: string
          people_id: string
          probability_percentage?: number | null
          property_address?: string | null
          property_type?: string | null
          referral_fee_expected?: number | null
          stage?: string
          updated_at?: string | null
          urgency_level?: string | null
          user_id: string
        }
        Update: {
          assigned_loan_officer?: string | null
          client_id?: string | null
          created_at?: string | null
          date_created?: string | null
          date_modified?: string | null
          estimated_loan_amount?: number | null
          expected_close_date?: string | null
          id?: string
          last_activity_date?: string | null
          lead_score?: number | null
          lead_source?: string | null
          marketing_campaign_id?: string | null
          notes?: string | null
          opportunity_type?: string
          people_id?: string
          probability_percentage?: number | null
          property_address?: string | null
          property_type?: string | null
          referral_fee_expected?: number | null
          stage?: string
          updated_at?: string | null
          urgency_level?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_people_id_fkey"
            columns: ["people_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          company_name: string | null
          contact_source: string | null
          contact_type: string
          created_at: string | null
          email_primary: string
          email_secondary: string | null
          first_name: string
          id: string
          last_contact_date: string | null
          last_name: string
          next_follow_up_date: string | null
          notes: string | null
          phone_primary: string | null
          phone_secondary: string | null
          preferred_communication_method: string | null
          relationship_strength_score: number | null
          social_facebook: string | null
          social_linkedin: string | null
          status: string | null
          tags: string[] | null
          title_position: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_name?: string | null
          contact_source?: string | null
          contact_type: string
          created_at?: string | null
          email_primary: string
          email_secondary?: string | null
          first_name: string
          id?: string
          last_contact_date?: string | null
          last_name: string
          next_follow_up_date?: string | null
          notes?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          preferred_communication_method?: string | null
          relationship_strength_score?: number | null
          social_facebook?: string | null
          social_linkedin?: string | null
          status?: string | null
          tags?: string[] | null
          title_position?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_name?: string | null
          contact_source?: string | null
          contact_type?: string
          created_at?: string | null
          email_primary?: string
          email_secondary?: string | null
          first_name?: string
          id?: string
          last_contact_date?: string | null
          last_name?: string
          next_follow_up_date?: string | null
          notes?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          preferred_communication_method?: string | null
          relationship_strength_score?: number | null
          social_facebook?: string | null
          social_linkedin?: string | null
          status?: string | null
          tags?: string[] | null
          title_position?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          appraisal_value: number | null
          bathrooms: number | null
          bedrooms: number | null
          closing_date: string | null
          comparable_properties: Json | null
          contract_date: string | null
          created_at: string | null
          days_on_market: number | null
          hoa_fees: number | null
          id: string
          inspection_issues: string[] | null
          listing_date: string | null
          listing_price: number | null
          listing_status: string | null
          lot_size: string | null
          mls_number: string | null
          neighborhood_info: string | null
          notes: string | null
          property_address: string
          property_condition: string | null
          property_features: Json | null
          property_taxes: number | null
          property_type: string | null
          realtor_id: string | null
          sale_price: number | null
          school_district: string | null
          square_footage: number | null
          updated_at: string | null
          user_id: string
          year_built: number | null
        }
        Insert: {
          appraisal_value?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          closing_date?: string | null
          comparable_properties?: Json | null
          contract_date?: string | null
          created_at?: string | null
          days_on_market?: number | null
          hoa_fees?: number | null
          id?: string
          inspection_issues?: string[] | null
          listing_date?: string | null
          listing_price?: number | null
          listing_status?: string | null
          lot_size?: string | null
          mls_number?: string | null
          neighborhood_info?: string | null
          notes?: string | null
          property_address: string
          property_condition?: string | null
          property_features?: Json | null
          property_taxes?: number | null
          property_type?: string | null
          realtor_id?: string | null
          sale_price?: number | null
          school_district?: string | null
          square_footage?: number | null
          updated_at?: string | null
          user_id: string
          year_built?: number | null
        }
        Update: {
          appraisal_value?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          closing_date?: string | null
          comparable_properties?: Json | null
          contract_date?: string | null
          created_at?: string | null
          days_on_market?: number | null
          hoa_fees?: number | null
          id?: string
          inspection_issues?: string[] | null
          listing_date?: string | null
          listing_price?: number | null
          listing_status?: string | null
          lot_size?: string | null
          mls_number?: string | null
          neighborhood_info?: string | null
          notes?: string | null
          property_address?: string
          property_condition?: string | null
          property_features?: Json | null
          property_taxes?: number | null
          property_type?: string | null
          realtor_id?: string | null
          sale_price?: number | null
          school_district?: string | null
          square_footage?: number | null
          updated_at?: string | null
          user_id?: string
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_realtor_id_fkey"
            columns: ["realtor_id"]
            isOneToOne: false
            referencedRelation: "realtors"
            referencedColumns: ["id"]
          },
        ]
      }
      realtors: {
        Row: {
          active_status: boolean | null
          average_deals_per_month: number | null
          brokerage_name: string | null
          commission_split_expectation: number | null
          communication_style: string | null
          created_at: string | null
          geographic_focus: string | null
          id: string
          license_number: string | null
          license_state: string | null
          marketing_co_op_available: boolean | null
          notes: string | null
          people_id: string
          performance_rating: number | null
          preferred_lenders: string[] | null
          price_range_focus: string | null
          referral_fee_standard: number | null
          relationship_level: number | null
          specialty_areas: string[] | null
          technology_adoption_level: string | null
          total_deals_closed: number | null
          total_referrals_sent: number | null
          updated_at: string | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          active_status?: boolean | null
          average_deals_per_month?: number | null
          brokerage_name?: string | null
          commission_split_expectation?: number | null
          communication_style?: string | null
          created_at?: string | null
          geographic_focus?: string | null
          id?: string
          license_number?: string | null
          license_state?: string | null
          marketing_co_op_available?: boolean | null
          notes?: string | null
          people_id: string
          performance_rating?: number | null
          preferred_lenders?: string[] | null
          price_range_focus?: string | null
          referral_fee_standard?: number | null
          relationship_level?: number | null
          specialty_areas?: string[] | null
          technology_adoption_level?: string | null
          total_deals_closed?: number | null
          total_referrals_sent?: number | null
          updated_at?: string | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          active_status?: boolean | null
          average_deals_per_month?: number | null
          brokerage_name?: string | null
          commission_split_expectation?: number | null
          communication_style?: string | null
          created_at?: string | null
          geographic_focus?: string | null
          id?: string
          license_number?: string | null
          license_state?: string | null
          marketing_co_op_available?: boolean | null
          notes?: string | null
          people_id?: string
          performance_rating?: number | null
          preferred_lenders?: string[] | null
          price_range_focus?: string | null
          referral_fee_standard?: number | null
          relationship_level?: number | null
          specialty_areas?: string[] | null
          technology_adoption_level?: string | null
          total_deals_closed?: number | null
          total_referrals_sent?: number | null
          updated_at?: string | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "realtors_people_id_fkey"
            columns: ["people_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      vectordocuments: {
        Row: {
          content: string | null
          document_reference_id: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          document_reference_id?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          document_reference_id?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_client_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_latest_conversations_per_session: {
        Args: { user_uuid: string }
        Returns: {
          id: number
          user_id: string
          message: string
          sender: string
          created_at: string
          session_id: string
        }[]
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
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