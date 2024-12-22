// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface MessageStat {
  id: number;
  character_id: string;
  message_count: number;
  last_used: string;
  wallet_address: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      message_stats: {
        Row: MessageStat;
        Insert: Omit<MessageStat, "id" | "created_at">;
        Update: Partial<Omit<MessageStat, "id" | "created_at">>;
      };
    };
  };
}
