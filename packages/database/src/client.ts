import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export function createSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export function createSupabaseServerClient(supabaseAccessToken?: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: supabaseAccessToken
        ? { Authorization: `Bearer ${supabaseAccessToken}` }
        : {},
    },
  });
}
