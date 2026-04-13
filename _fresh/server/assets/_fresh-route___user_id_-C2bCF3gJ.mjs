import { d as define, a, s, l, u, g as getBoardBySlug, n as getUserById, b as getKv } from "../server-entry.mjs";
import { g as getPostsByIds, f as getUserFavorites } from "./posts-DP3b7mwx.mjs";
import { t as timeAgo } from "./time-AqCAYVTU.mjs";
const $$_tpl_1 = ["<div ", '><div class="card"><div class="user-header"><div class="user-avatar">', '</div><div class="user-info"><h1>', "", "", "</h1><p>加入于 ", "</p></div>", '</div></div><div class="tabs" ', ">", "", '</div><div class="card">', "</div></div>"];
const $$_tpl_2 = ['<span class="user-badge admin" ', ">管理员</span>"];
const $$_tpl_3 = ['<span class="user-badge banned" ', ">已禁言</span>"];
const $$_tpl_4 = ['<div class="empty-state"><div class="empty-state-icon">', '</div><p class="empty-state-text">', "</p></div>"];
const $$_tpl_5 = ['<ul class="post-list">', "</ul>"];
const $$_tpl_6 = ['<li class="post-item" ', '><div class="post-meta-left"><span class="post-replies-count">', '</span><span class="post-replies-label">回复</span></div><div class="post-content-area"><div class="post-title">', '</div><div class="post-info"><span class="post-board-tag">', " ", '</span><span class="post-time">', '</span><span class="post-stats"><span>👍 ', "</span></span></div></div></li>"];
const handler$1 = define.handlers({
  async GET(ctx) {
    const {
      id
    } = ctx.params;
    const user = await getUserById(id);
    if (!user) return ctx.renderNotFound();
    const url = new URL(ctx.req.url);
    const tab = url.searchParams.get("tab") || "posts";
    const kv = await getKv();
    let posts = [];
    if (tab === "posts") {
      const entries = kv.list({
        prefix: ["posts_by_user", id]
      }, {
        limit: 20
      });
      const postIds = [];
      for await (const entry of entries) postIds.push(entry.value);
      posts = await getPostsByIds(postIds);
    } else if (tab === "favorites" && ctx.state.user?.id === id) {
      const result = await getUserFavorites(id);
      posts = result.items;
    }
    const isOwner = ctx.state.user?.id === id;
    return {
      data: {
        profileUser: user,
        tab,
        posts,
        isOwner
      }
    };
  }
});
const _id_ = define.page(function UserPage({
  data
}) {
  const {
    profileUser,
    tab,
    posts,
    isOwner
  } = data;
  return a($$_tpl_1, l("style", {
    padding: "var(--space-md) 0"
  }), s(profileUser.username.charAt(0).toUpperCase()), s(profileUser.username), s(profileUser.role === "admin" && a($$_tpl_2, l("style", {
    marginLeft: "8px"
  }))), s(profileUser.banned && a($$_tpl_3, l("style", {
    marginLeft: "8px"
  }))), s(timeAgo(profileUser.createdAt)), s(isOwner && u("a", {
    href: "/auth/change-password",
    class: "btn btn-secondary btn-sm",
    style: {
      marginLeft: "auto",
      alignSelf: "center"
    },
    children: "🔑 修改密码"
  })), l("style", {
    marginTop: "var(--space-md)"
  }), u("a", {
    href: `/user/${profileUser.id}?tab=posts`,
    class: `tab ${tab === "posts" ? "active" : ""}`,
    children: "📝 帖子"
  }), s(isOwner && u("a", {
    href: `/user/${profileUser.id}?tab=favorites`,
    class: `tab ${tab === "favorites" ? "active" : ""}`,
    children: "⭐ 收藏"
  })), s(posts.length === 0 ? a($$_tpl_4, s(tab === "posts" ? "📝" : "⭐"), s(tab === "posts" ? "还没有发过帖子" : "还没有收藏的帖子")) : a($$_tpl_5, s(posts.map((post) => a($$_tpl_6, l("key", post.id), s(post.replyCount), u("a", {
    href: `/post/${post.id}`,
    children: post.title
  }), s(getBoardBySlug(post.boardSlug)?.icon), s(getBoardBySlug(post.boardSlug)?.name), s(timeAgo(post.createdAt)), s(post.likeCount)))))));
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___user_id_ = _id_;
export {
  config,
  css,
  _freshRoute___user_id_ as default,
  handler,
  handlers
};
