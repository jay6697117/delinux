// 静态资源缓存策略判定（纯函数，无副作用，可单测）

/**
 * 根据请求路径返回对应的 cache-control 值
 * - /styles.css → 7 天缓存 + stale-while-revalidate
 * - /_fresh/* 和 /assets/* → 永久缓存（immutable）
 * - 其他 → null（不设缓存）
 */
export function getCacheControl(pathname: string): string | null {
  if (pathname === "/styles.css") {
    return "public, max-age=604800, stale-while-revalidate=2592000";
  }
  if (pathname.startsWith("/_fresh/") || pathname.startsWith("/assets/")) {
    return "public, max-age=31536000, immutable";
  }
  return null;
}

// ===== 通用内存缓存（带 TTL，用于帖子列表等高频读取数据） =====

const dataCache = new Map<string, { data: unknown; expAt: number }>();
const DATA_CACHE_TTL = 30 * 1000; // 30 秒（帖子列表等低时效性数据）

// 获取缓存数据（命中返回数据，未命中返回 null）
export function getCachedData<T>(key: string): T | null {
  const cached = dataCache.get(key);
  if (cached && cached.expAt > Date.now()) return cached.data as T;
  dataCache.delete(key);
  return null;
}

// 设置缓存数据
export function setCachedData<T>(key: string, data: T): void {
  dataCache.set(key, { data, expAt: Date.now() + DATA_CACHE_TTL });
  // 防止内存泄漏：超过 500 条时清理过期条目
  if (dataCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of dataCache) {
      if (v.expAt < now) dataCache.delete(k);
    }
  }
}

// 写操作后主动失效相关缓存
export function invalidateCache(keyPrefix: string): void {
  for (const k of dataCache.keys()) {
    if (k.startsWith(keyPrefix)) dataCache.delete(k);
  }
}
