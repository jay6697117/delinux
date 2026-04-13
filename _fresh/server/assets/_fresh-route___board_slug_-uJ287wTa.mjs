import { d as define, a, s, u, l, c as getBoard, b as getKv } from "../server-entry.mjs";
import { t as timeAgo } from "./time-AqCAYVTU.mjs";
const $$_tpl_1 = ['<div><div class="page-header"><h1 class="page-title">', " ", " — ", "</h1>", '</div><div class="card">', "", "</div></div>"];
const $$_tpl_2 = ['<div class="empty-state"><div class="empty-state-icon">', '</div><p class="empty-state-text">这个版块还没有帖子</p></div>'];
const $$_tpl_3 = ['<ul class="post-list">', "</ul>"];
const $$_tpl_4 = ['<li class="post-item" ', '><div class="post-meta-left"><span class="post-replies-count">', '</span><span class="post-replies-label">回复</span></div><div class="post-content-area"><div class="post-title">', '</div><div class="post-info"><span class="post-author">', '</span><span class="post-time">', '</span><span class="post-stats"><span>👍 ', "</span><span>💬 ", "</span></span></div></div></li>"];
const $$_tpl_5 = ['<div class="pagination">', "</div>"];
const handler$1 = define.handlers({
  async GET(ctx) {
    const {
      slug
    } = ctx.params;
    const board = await getBoard(slug);
    if (!board) return ctx.renderNotFound();
    const url = new URL(ctx.req.url);
    const cursor = url.searchParams.get("cursor") || void 0;
    const limit = 20;
    const kv = await getKv();
    const entries = kv.list({
      prefix: ["posts_by_board", slug]
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
    const posts = [];
    for (const id of postIds) {
      const pe = await kv.get(["posts", id]);
      if (pe.value) posts.push(pe.value);
    }
    return {
      data: {
        board,
        posts,
        hasMore,
        nextCursor,
        slug
      }
    };
  }
});
const _slug_ = define.page(function BoardPage({
  data,
  state
}) {
  const {
    board,
    posts,
    hasMore,
    nextCursor,
    slug
  } = data;
  return a($$_tpl_1, s(board.icon), s(board.name), s(board.description), s(state.user && u("a", {
    href: `/post/new?board=${slug}`,
    class: "btn btn-primary",
    children: "发帖"
  })), s(posts.length === 0 ? a($$_tpl_2, s(board.icon)) : a($$_tpl_3, s(posts.map((post) => a($$_tpl_4, l("key", post.id), s(post.replyCount), u("a", {
    href: `/post/${post.id}`,
    children: post.title
  }), s(post.authorName), s(timeAgo(post.createdAt)), s(post.likeCount), s(post.replyCount)))))), s(hasMore && nextCursor && a($$_tpl_5, u("a", {
    href: `/board/${slug}?cursor=${nextCursor}`,
    class: "btn btn-secondary",
    children: "加载更多"
  }))));
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___board_slug_ = _slug_;
export {
  config,
  css,
  _freshRoute___board_slug_ as default,
  handler,
  handlers
};
