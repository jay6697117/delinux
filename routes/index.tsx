import { define } from "../utils.ts";
import { BOARDS, getBoardBySlug } from "../utils/boards.ts";
import { getKv } from "../utils/db.ts";
import { getPostsByIds } from "../utils/posts.ts";
import { timeAgo } from "../utils/time.ts";
import { getCachedData, setCachedData } from "../utils/cache.ts";
import type { Post } from "../utils/state.ts";

export const handler = define.handlers({
  async GET(ctx) {
    try {
      const url = new URL(ctx.req.url);
      const cursor = url.searchParams.get("cursor") || undefined;
      const limit = 20;

      // P1a: 直接用静态常量，省掉 5 次 KV get
      const boards = BOARDS;

      // 首页无分页时使用内存缓存（30 秒 TTL）
      const cacheKey = cursor ? "" : "home:latest";
      if (cacheKey) {
        const cached = getCachedData<{
          boards: typeof BOARDS;
          posts: Awaited<ReturnType<typeof getPostsByIds>>;
          hasMore: boolean;
          nextCursor: string | undefined;
        }>(cacheKey);
        if (cached) return { data: cached };
      }

      const kv = await getKv();
      const entries = kv.list<string>({ prefix: ["posts_latest"] }, {
        limit: limit + 1,
        cursor,
        consistency: "eventual",
      });

      const postIds: string[] = [];
      let nextCursor: string | undefined;
      let count = 0;

      for await (const entry of entries) {
        count++;
        if (count > limit) break;
        postIds.push(entry.value as string);
        nextCursor = entries.cursor;
      }

      const hasMore = count > limit;

      // P1b: 批量并行获取帖子详情
      const posts = await getPostsByIds(postIds);

      const data = { boards, posts, hasMore, nextCursor };

      // 缓存首页数据（无分页时）
      if (cacheKey) setCachedData(cacheKey, data);

      return { data };
    } catch (err) {
      console.error("首页数据加载失败:", err);
      // 降级：返回空数据 + 静态版块列表
      return {
        data: {
          boards: BOARDS,
          posts: [] as Post[],
          hasMore: false,
          nextCursor: undefined,
        },
      };
    }
  },
});

export default define.page<typeof handler>(function Home({ data }) {
  const { boards, posts, hasMore, nextCursor } = data;

  return (
    <div>
      <div class="board-grid">
        {boards.map((board) => (
          <a href={`/board/${board.slug}`} class="board-card" key={board.slug}>
            <span class="board-icon">{board.icon}</span>
            <div class="board-info">
              <h3>{board.name}</h3>
              <p>{board.description}</p>
            </div>
          </a>
        ))}
      </div>

      <div class="card" style={{ marginTop: "var(--space-md)" }}>
        <div
          class="card-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>📋 最新动态</span>
        </div>
        {posts.length === 0
          ? (
            <div class="empty-state">
              <div class="empty-state-icon">✨</div>
              <p class="empty-state-text">还没有帖子，来发第一篇吧！</p>
            </div>
          )
          : (
            <ul class="post-list">
              {posts.map((post) => (
                <li class="post-item" key={post.id}>
                  <div class="post-meta-left">
                    <span class="post-replies-count">{post.replyCount}</span>
                    <span class="post-replies-label">回复</span>
                  </div>
                  <div class="post-content-area">
                    <div class="post-title">
                      <a href={`/post/${post.id}`}>{post.title}</a>
                    </div>
                    <div class="post-info">
                      <span class="post-board-tag">
                        {getBoardBySlug(post.boardSlug)?.icon}{" "}
                        {getBoardBySlug(post.boardSlug)?.name}
                      </span>
                      <span class="post-author">{post.authorName}</span>
                      <span class="post-time">{timeAgo(post.createdAt)}</span>
                      <span class="post-stats">
                        <span>👍 {post.likeCount}</span>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        {hasMore && nextCursor && (
          <div class="pagination">
            <a href={`/?cursor=${nextCursor}`} class="btn btn-secondary">
              加载更多
            </a>
          </div>
        )}
      </div>
    </div>
  );
});
