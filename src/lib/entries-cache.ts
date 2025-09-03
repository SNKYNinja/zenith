type CacheValue<T> = { value: T; expiresAt: number };
const store = new Map<string, CacheValue<unknown>>();

export function cacheGet<T>(key: string): T | null {
    const item = store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
        store.delete(key);
        return null;
    }
    return item.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheClear(key?: string) {
    if (key) store.delete(key);
    else store.clear();
}
