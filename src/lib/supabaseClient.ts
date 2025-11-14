import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL と anon key が設定されていません。.env.local を確認してください。",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const createSupabaseServerClient = (): SupabaseClient<Database> =>
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

export const createSupabaseAdminClient = (): SupabaseClient<Database> => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY が設定されていません。.env.local を確認してください。",
    );
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

