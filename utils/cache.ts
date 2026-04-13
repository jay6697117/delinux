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
