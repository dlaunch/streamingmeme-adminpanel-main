export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ArticleStatus =
  | "pending_analysis"
  | "for_categorization"
  | "for_verification"
  | "waiting_approval"
  | "approved_for_publishing"
  | "filtered_out";

export type ArticleClassification =
  | "active"
  | "archived"
  | "published";

export type AdminHistoryStatus =
  | "GENERAL_ACTION"
  | "ARTICLE_APPROVED"
  | "ARTICLE_UNAPPROVED"
  | "ARTICLE_PROMOTED_TOPNEWS"
  | "ARTICLE_DECLINED"
  | "ARTICLE_ARCHIVED"
  | "ARTICLE_EDITED"
  | "SPONSOR_PROMOTED_TOPNEWS";

export type UserRole = "admin" | "user";

export interface Database {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string;
          title: string;
          content: string | null;
          summary: string | null;
          url: string | null;
          source_name: string | null;
          source_url: string | null;
          author: string | null;
          image_url: string | null;
          article_category: string | null;
          status: ArticleStatus;
          classification: ArticleClassification;
          filtered_out_reason: string | null;
          ai_score: number | null;
          ai_summary: string | null;
          ai_tags: string[] | null;
          original_publish_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content?: string | null;
          summary?: string | null;
          url?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          author?: string | null;
          image_url?: string | null;
          article_category?: string | null;
          status?: ArticleStatus;
          classification?: ArticleClassification;
          filtered_out_reason?: string | null;
          ai_score?: number | null;
          ai_summary?: string | null;
          ai_tags?: string[] | null;
          original_publish_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string | null;
          summary?: string | null;
          url?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          author?: string | null;
          image_url?: string | null;
          article_category?: string | null;
          status?: ArticleStatus;
          classification?: ArticleClassification;
          filtered_out_reason?: string | null;
          ai_score?: number | null;
          ai_summary?: string | null;
          ai_tags?: string[] | null;
          original_publish_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      top_news_items: {
        Row: {
          id: string;
          article_id: string;
          sponsor_id: string | null;
          position: number;
          promoted_by: string;
          promoted_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          sponsor_id?: string | null;
          position?: number;
          promoted_by: string;
          promoted_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          sponsor_id?: string | null;
          position?: number;
          promoted_by?: string;
          promoted_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_history: {
        Row: {
          id: number;
          action_description: string | null;
          status: AdminHistoryStatus | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: number;
          action_description?: string | null;
          status?: AdminHistoryStatus | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: number;
          action_description?: string | null;
          status?: AdminHistoryStatus | null;
          created_at?: string;
          created_by?: string | null;
        };
      };
      sponsors: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          website_url: string | null;
          article_title: string | null;
          article_content: string | null;
          article_url: string | null;
          is_active: boolean;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          article_title?: string | null;
          article_content?: string | null;
          article_url?: string | null;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          article_title?: string | null;
          article_content?: string | null;
          article_url?: string | null;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          name: UserRole;
          description: string | null;
          permissions: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: UserRole;
          description?: string | null;
          permissions?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: UserRole;
          description?: string | null;
          permissions?: Json | null;
          created_at?: string;
        };
      };
      user_profile_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          assigned_by?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      article_status: ArticleStatus;
      article_classification: ArticleClassification;
      admin_history_status: AdminHistoryStatus;
      user_role: UserRole;
    };
  };
}
