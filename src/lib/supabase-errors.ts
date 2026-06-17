/** Format Supabase/PostgREST errors for logging (objects often print as `{}`). */
export function formatSupabaseError(error: unknown): string {
  if (!error) return 'Unknown error';
  if (typeof error === 'object' && error !== null) {
    const e = error as {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    };
    const parts = [e.message, e.code, e.details, e.hint].filter(Boolean);
    return parts.length > 0 ? parts.join(' — ') : JSON.stringify(error);
  }
  return String(error);
}
