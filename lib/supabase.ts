import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client — document storage backend.
 *
 * Like the Clerk setup, this is INERT until the keys exist: `supabaseEnabled`
 * is false and `getSupabase()` returns null when env vars are missing, so the
 * app keeps running on local (Zustand `persist`) storage until you connect a
 * real project. Add these to `.env.local` (never commit them):
 *
 *   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
 *   NEXT_PUBLIC_SUPABASE_DOCS_BUCKET=documents   # optional, defaults to "documents"
 *
 * Then create a Storage bucket named `documents` in the Supabase dashboard. For
 * per-user isolation, add a row-level security policy keyed on the path prefix
 * (`<userId>/...`) using the Clerk user id passed through a Supabase JWT — see
 * the storage-integration notes in AGENTS.md.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True once a Supabase project URL + anon key are configured. */
export const supabaseEnabled = !!(url && anonKey);

/** Storage bucket holding per-user document JSON. */
export const DOCS_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_DOCS_BUCKET || "documents";

let client: SupabaseClient | null = null;
let authedClient: { token: string; sb: SupabaseClient } | null = null;

/**
 * Lazily create (and reuse) the browser client, or null if not configured.
 *
 * Pass a Clerk-issued Supabase JWT (`accessToken`) to authenticate the request
 * as that user — required for path-scoped RLS isolation. Without a token the
 * client uses the anon role, which only works if the bucket has a permissive
 * RLS policy (fine for a prototype, not isolated).
 */
export function getSupabase(accessToken?: string | null): SupabaseClient | null {
  if (!supabaseEnabled) return null;
  if (accessToken) {
    if (authedClient?.token === accessToken) return authedClient.sb;
    const sb = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    authedClient = { token: accessToken, sb };
    return sb;
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
