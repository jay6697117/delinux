import { define } from "../../utils.ts";
import { getBoardBySlug } from "../../utils/boards.ts";
import { getBoardPosts } from "../../utils/posts.ts";
import { timeAgo } from "../../utils/time.ts";
import { getCachedData, setCachedData } from "../../utils/cache.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const { slug } = ctx.params;
    const board = getBoardBySlug(slug);
    if (!board) return ctx.renderNotFound();

    const url = new URL(ctx.req.url);
    const page = parseInt(url.searchParams.get("page") || "0");
    const limit = 20;

    // 无分页时使用内存缓存（30 秒 TTL）
    const cacheKey = page === 0 ? `board:${slug}` : "";
    if (cacheKey) {
      const cached = getCachedData<{
        board: typeof board;
        posts: Awaited<ReturnType<typeof getBoardPosts>>["posts"];
        hasMore: boolean;
        page: number;
        slug: string;
      }>(cacheKey);
      if (cached) return { data: cached };
    }

    // 一条 SQL 获取版块帖子
    const { posts, hasMore } = await getBoardPosts(slug, limit, page * limit);

    const data = { board, posts, hasMore, page, slug };

    if (cacheKey) setCachedData(cacheKey, data);

    return { data };
  },
});

export default define.page<typeof handler>(function BoardPage({ data, state }) {
  const { board, posts, hasMore, page, slug } = data;
  return (
    <div>
      <div class="page-header">
        <h1 class="page-title">
          {board.icon} {board.name} — {board.description}
        </h1>
        {state.user && (
          <a href={`/post/new?board=${slug}`} class="btn btn-primary">发帖</a>
        )}
      </div>
      <div class="card">
        {posts.length === 0
          ? (
            <div class="empty-state">
              <div class="empty-state-icon">{board.icon}</div>
              <p class="empty-state-text">这个版块还没有帖子</p>
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
                      <span class="post-author">{post.authorName}</span>
                      <span class="post-time">{timeAgo(post.createdAt)}</span>
                      <span class="post-stats">
                        <span>👍 {post.likeCount}</span>
                        <span>💬 {post.replyCount}</span>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        {hasMore && (
          <div class="pagination">
            <a
              href={`/board/${slug}?page=${page + 1}`}
              class="btn btn-secondary"
            >
              加载更多
            </a>
          </div>
        )}
      </div>
    </div>
  );
});
