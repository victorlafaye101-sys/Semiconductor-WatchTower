interface CacheEntry<T> {
  data: T;
  updatedAt: string;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_SEC = Number.parseInt(process.env.CACHE_TTL ?? "600", 10);

export function getCache<T>(
  key: string,
): { data: T; updatedAt: string } | null {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() >= entry.expiresAt) {
    // 保留过期条目，供 getStaleCache 在上游失败时降级
    return null;
  }

  return { data: entry.data as T, updatedAt: entry.updatedAt };
}

/** 过期也返回，用于上游失败时的 stale 降级 */
export function getStaleCache<T>(
  key: string,
): { data: T; updatedAt: string } | null {
  const entry = store.get(key);
  if (!entry) return null;
  return { data: entry.data as T, updatedAt: entry.updatedAt };
}

export function setCache<T>(
  key: string,
  data: T,
  ttlSec: number = DEFAULT_TTL_SEC,
): string {
  const updatedAt = new Date().toISOString();
  store.set(key, {
    data,
    updatedAt,
    expiresAt: Date.now() + ttlSec * 1000,
  });
  return updatedAt;
}
