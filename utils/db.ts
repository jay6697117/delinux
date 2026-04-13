// Deno KV 数据库连接与工具函数

let _kv: Deno.Kv | null = null;

// 获取 KV 实例（单例）
export async function getKv(): Promise<Deno.Kv> {
  if (!_kv) {
    // 如果没有部署 ID 说明在本地，指定固定本地文件以防多脚本数据库隔离
    const isDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
    _kv = await Deno.openKv(isDeploy ? undefined : "./local.sqlite");
  }
  return _kv;
}

// 时间戳反转，用于 KV 中按时间倒序排列
// KV 的 list 是字典序，所以用 MAX - timestamp 使得最新的排在前面
const MAX_TIMESTAMP = 9999999999999;

export function invertTimestamp(ts: number): string {
  return String(MAX_TIMESTAMP - ts).padStart(13, "0");
}

// 生成唯一 ID
export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

// 分页参数
export interface PaginationOptions {
  cursor?: string;
  limit?: number;
}

// 分页结果
export interface PaginatedResult<T> {
  items: T[];
  cursor?: string;
  hasMore: boolean;
}

// 通用的 KV 列表查询（带分页）
export async function kvList<T>(
  prefix: Deno.KvKey,
  options: PaginationOptions = {},
): Promise<PaginatedResult<T>> {
  const kv = await getKv();
  const limit = options.limit || 20;

  const entries = kv.list<T>({ prefix }, {
    limit: limit + 1,
    cursor: options.cursor,
  });

  const items: T[] = [];
  let cursor: string | undefined;
  let count = 0;

  for await (const entry of entries) {
    count++;
    if (count > limit) {
      break;
    }
    items.push(entry.value);
    cursor = entries.cursor;
  }

  return {
    items,
    cursor: count > limit ? cursor : undefined,
    hasMore: count > limit,
  };
}
