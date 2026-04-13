import { d as define, a, s, u, l, g as getBoardBySlug, B as BOARDS, b as getKv } from "../server-entry.mjs";
import { g as getPostsByIds } from "./posts-DP3b7mwx.mjs";
import { t as timeAgo } from "./time-AqCAYVTU.mjs";
const $$_tpl_1 = ['<div><div class="board-grid">', '</div><div class="card" ', '><div class="card-header" ', "><span>📋 最新动态</span></div>", "", "</div></div>"];
const $$_tpl_2 = ['<span class="board-icon">', '</span><div class="board-info"><h3>', "</h3><p>", "</p></div>"];
const $$_tpl_3 = ['<div class="empty-state"><div class="empty-state-icon">✨</div><p class="empty-state-text">还没有帖子，来发第一篇吧！</p></div>'];
const $$_tpl_4 = ['<ul class="post-list">', "</ul>"];
const $$_tpl_5 = ['<li class="post-item" ', '><div class="post-meta-left"><span class="post-replies-count">', '</span><span class="post-replies-label">回复</span></div><div class="post-content-area"><div class="post-title">', '</div><div class="post-info"><span class="post-board-tag">', " ", '</span><span class="post-author">', '</span><span class="post-time">', '</span><span class="post-stats"><span>👍 ', "</span></span></div></div></li>"];
const $$_tpl_6 = ['<div class="pagination">', "</div>"];
const handler$1 = define.handlers({
  async GET(ctx) {
    try {
      const url = new URL(ctx.req.url);
      const cursor = url.searchParams.get("cursor") || void 0;
      const limit = 20;
      const boards = BOARDS;
      const kv = await getKv();
      const entries = kv.list({
        prefix: ["posts_latest"]
      }, {
        limit: limit + 1,
        cursor
      });
      const postIds = [];
      let nextCursor;
      let count = 0;
      for await (const entry of entries) {
        count++;
        if (count > limit) break;
        postIds.push(entry.value);
        nextCursor = entries.cursor;
      }
      const hasMore = count > limit;
      const posts = await getPostsByIds(postIds);
      return {
        data: {
          boards,
          posts,
          hasMore,
          nextCursor
        }
      };
    } catch (err) {
      console.error("首页数据加载失败:", err);
      return {
        data: {
          boards: BOARDS,
          posts: [],
          hasMore: false,
          nextCursor: void 0
        }
      };
    }
  }
});
const index = define.page(function Home({
  data
}) {
  const {
    boards,
    posts,
    hasMore,
    nextCursor
  } = data;
  return a($$_tpl_1, s(boards.map((board) => u("a", {
    href: `/board/${board.slug}`,
    class: "board-card",
    children: a($$_tpl_2, s(board.icon), s(board.name), s(board.description))
  }, board.slug))), l("style", {
    marginTop: "var(--space-md)"
  }), l("style", {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  }), s(posts.length === 0 ? a($$_tpl_3) : a($$_tpl_4, s(posts.map((post) => a($$_tpl_5, l("key", post.id), s(post.replyCount), u("a", {
    href: `/post/${post.id}`,
    children: post.title
  }), s(getBoardBySlug(post.boardSlug)?.icon), s(getBoardBySlug(post.boardSlug)?.name), s(post.authorName), s(timeAgo(post.createdAt)), s(post.likeCount)))))), s(hasMore && nextCursor && a($$_tpl_6, u("a", {
    href: `/?cursor=${nextCursor}`,
    class: "btn btn-secondary",
    children: "加载更多"
  }))));
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___index = index;
export {
  config,
  css,
  _freshRoute___index as default,
  handler,
  handlers
};
