"use server";

// Cache implementation moved into server action
type CacheValue<T> = { value: T; expiresAt: number };
const store = new Map<string, CacheValue<unknown>>();

function cacheGet<T>(key: string): T | null {
    const item = store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
        store.delete(key);
        return null;
    }
    return item.value as T;
}

function cacheSet<T>(key: string, value: T, ttlMs: number) {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function cacheClear(key?: string) {
    if (key) store.delete(key);
    else store.clear();
}

type RefreshCacheResult = {
    ok: boolean;
    cleared: string;
    error?: string;
};

export async function refreshEntriesCache(): Promise<RefreshCacheResult> {
    try {
        cacheClear("entries");

        return {
            ok: true,
            cleared: "entries",
        };
    } catch (error: any) {
        return {
            ok: false,
            cleared: "",
            error: error.message || "Failed to clear cache",
        };
    }
}

// Export cache functions for use by other server actions if needed
export { cacheGet, cacheSet, cacheClear };
