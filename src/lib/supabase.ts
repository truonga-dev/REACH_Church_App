import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing:', { supabaseUrl, supabaseAnonKey });
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

const fetchWithLogging = async (
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
) => {
  try {
    return await fetch(input, init);
  } catch (error) {
    console.error('Supabase fetch failed', { input, init, error });
    throw error;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
      return await fn();
    }
  },
  global: {
    fetch: fetchWithLogging,
  },
});

// Admin client bypasses RLS - used for admin operations (create/update/delete livestreams etc.)
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetchWithLogging },
    })
  : supabase; // Fallback to anon client if no service key
