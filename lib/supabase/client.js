'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let client;

/** Reuse a single browser client for database, auth, storage and realtime calls. */
export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      'Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local or your build environment.',
    );
  }

  client = createSupabaseClient(url, publishableKey);
  return client;
}
