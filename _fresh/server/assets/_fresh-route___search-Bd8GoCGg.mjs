import { d as define, a, s, l, u, g as getAllBoards } from "../server-entry.mjs";
import { s as searchPosts } from "./posts-CtOzPUAj.mjs";
import { t as timeAgo } from "./time-AqCAYVTU.mjs";
const $$_tpl_1 = ["<div ", '><h1 class="page-title" ', '>🔍 搜索</h1><form method="GET" class="search-bar"><input class="form-input" type="text" name="q" ', ' placeholder="搜索帖子标题..." autofocus><button type="submit" class="btn btn-primary">搜索</button></form>', "</div>"];
const $$_tpl_2 = ['<div class="card"><div class="card-header">搜索 &quot;', "&quot; 的结果 (", ")</div>", "</div>"];
const $$_tpl_3 = ['<div class="empty-state"><div class="empty-state-icon">🔍</div><p class="empty-state-text">没有找到相关帖子</p></div>'];
const $$_tpl_4 = ['<ul class="post-list">', "</ul>"];
const $$_tpl_5 = ['<li class="post-item" ', '><div class="post-meta-left"><span class="post-replies-count">', '</span><span class="post-replies-label">回复</span></div><div class="post-content-area"><div class="post-title">', '</div><div class="post-info"><span class="post-board-tag">', " ", '</span><span class="post-author">', '</span><span class="post-time">', "</span></div></div></li>"];
const handler$1 = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const query = url.searchParams.get("q") || "";
    const boards = await getAllBoards();
    const posts = query ? await searchPosts(query) : [];
    return {
      data: {
        query,
        boards,
        posts
      }
    };
  }
});
const search = define.page(function SearchPage({
  data
}) {
  const {
    query,
    boards,
    posts
  } = data;
  return a($$_tpl_1, l("style", {
    padding: "var(--space-md) 0"
  }), l("style", {
    marginBottom: "var(--space-md)"
  }), l("value", query), s(query && a($$_tpl_2, s(query), s(posts.length), s(posts.length === 0 ? a($$_tpl_3) : a($$_tpl_4, s(posts.map((post) => a($$_tpl_5, l("key", post.id), s(post.replyCount), u("a", {
    href: `/post/${post.id}`,
    children: post.title
  }), s(boards.find((b) => b.slug === post.boardSlug)?.icon), s(boards.find((b) => b.slug === post.boardSlug)?.name), s(post.authorName), s(timeAgo(post.createdAt))))))))));
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___search = search;
export {
  config,
  css,
  _freshRoute___search as default,
  handler,
  handlers
};
