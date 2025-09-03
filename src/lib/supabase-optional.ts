// Optional Supabase integration behind a strict flag. Not executed unless enabled.
import { config } from "./config";

export async function withSupabase<T>(fn: () => Promise<T>): Promise<T | null> {
    if (!config.features.supabaseEnabled) return null;
    // If you enable Supabase, import lazily to avoid bundling unless used.
    const { createServerClient, createBrowserClient } = await import(
        "@supabase/ssr"
    );
    // Example usage pattern (do not run unless enabled and properly configured).
    // const supabase = createServerClient<Database>(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //   process.env.SUPABASE_SERVICE_ROLE_KEY!,
    //   { cookies: () => ({ get() {}, set() {}, remove() {} }) }
    // )
    // return fn()
    return fn();
}
