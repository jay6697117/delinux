import { define } from "../utils.ts";
import { BOARDS, getBoardBySlug } from "../utils/boards.ts";
import { getLatestPosts } from "../utils/posts.ts";
import { timeAgo } from "../utils/time.ts";
import { getCachedData, setCachedData } from "../utils/cache.ts";

export const handler = define.handlers({
  async GET(ctx) {
    try {
      const url = new URL(ctx.req.url);
      const page = parseInt(url.searchParams.get("page") || "0");
      const limit = 20;

      const boards = BOARDS;

      // 首页无分页时使用内存缓存（30 秒 TTL）
      const cacheKey = page === 0 ? "home:latest" : "";
      if (cacheKey) {
        const cached = getCachedData<{
          boards: typeof BOARDS;
          posts: Awaited<ReturnType<typeof getLatestPosts>>["posts"];
          hasMore: boolean;
          page: number;
        }>(cacheKey);
        if (cached) return { data: cached };
      }

      // 一条 SQL 获取最新帖子（替代 kv.list + getMany 两步走）
      const { posts, hasMore } = await getLatestPosts(limit, page * limit);

      const data = { boards, posts, hasMore, page };

      if (cacheKey) setCachedData(cacheKey, data);

      return { data };
    } catch (err) {
      console.error("首页数据加载失败:", err);
      return {
        data: {
          boards: BOARDS,
          posts: [] as Awaited<ReturnType<typeof getLatestPosts>>["posts"],
          hasMore: false,
          page: 0,
        },
      };
    }
  },
});

export default define.page<typeof handler>(function HomePage({ data, state }) {
  const { boards, posts, hasMore, page } = data;
  return (
    <div>
      {/* 版块导航 */}
      <div class="board-grid">
        {boards.map((board) => (
          <a href={`/board/${board.slug}`} class="board-card" key={board.slug}>
            <div class="board-icon">{board.icon}</div>
            <div class="board-info">
              <div class="board-name">{board.name}</div>
              <div class="board-desc">{board.description}</div>
            </div>
          </a>
        ))}
      </div>

      {/* 最新帖子 */}
      <div class="card" style={{ marginTop: "var(--space-lg)" }}>
        <div class="page-header">
          <h2 class="page-title">🔥 最新动态</h2>
          {state.user && <a href="/post/new" class="btn btn-primary">发帖</a>}
        </div>
        {posts.length === 0
          ? (
            <div class="empty-state">
              <div class="empty-state-icon">📭</div>
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
        {hasMore && (
          <div class="pagination">
            <a href={`/?page=${page + 1}`} class="btn btn-secondary">
              加载更多
            </a>
          </div>
        )}
      </div>
    </div>
  );
});
