import { d as define, a, s, l, u, b as getKv } from "../server-entry.mjs";
import { t as timeAgo } from "./time-AqCAYVTU.mjs";
const $$_tpl_1 = ["<div ", '><h1 class="page-title" ', '>🛡️ 管理后台</h1><div class="tabs">', "", "", "</div>", "", "", "</div>"];
const $$_tpl_2 = ['<div class="admin-stats"><div class="stat-card"><div class="stat-value">', '</div><div class="stat-label">注册用户</div></div><div class="stat-card"><div class="stat-value">', '</div><div class="stat-label">帖子总数</div></div><div class="stat-card"><div class="stat-value">', '</div><div class="stat-label">回复总数</div></div></div>'];
const $$_tpl_3 = ['<div class="card" ', '><table class="admin-table"><thead><tr><th>用户名</th><th>邮箱</th><th>角色</th><th>状态</th><th>注册时间</th><th>操作</th></tr></thead><tbody>', "</tbody></table></div>"];
const $$_tpl_4 = ["<tr ", "><td>", "</td><td ", ">", "</td><td><span ", ">", "</span></td><td>", "</td><td ", ">", "</td><td>", "</td></tr>"];
const $$_tpl_5 = ["<span ", ">已禁言</span>"];
const $$_tpl_6 = ["<span ", ">正常</span>"];
const $$_tpl_7 = ['<form method="POST" action="/api/admin/ban-user" ', '><input type="hidden" name="userId" ', '><input type="hidden" name="action" ', '><button type="submit" ', ">", "</button></form>"];
const $$_tpl_8 = ['<div class="card" ', '><table class="admin-table"><thead><tr><th>标题</th><th>版块</th><th>作者</th><th>回复</th><th>点赞</th><th>时间</th><th>操作</th></tr></thead><tbody>', "</tbody></table></div>"];
const $$_tpl_9 = ["<tr ", "><td>", "</td><td>", "</td><td>", "</td><td>", "</td><td>", "</td><td ", ">", '</td><td><form method="POST" action="/api/admin/delete-post" ', '><input type="hidden" name="postId" ', '><button type="submit" class="btn btn-sm btn-danger">删除</button></form></td></tr>'];
const handler$1 = define.handlers({
  async GET(ctx) {
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response(null, {
        status: 302,
        headers: {
          location: "/"
        }
      });
    }
    const url = new URL(ctx.req.url);
    const tab = url.searchParams.get("tab") || "overview";
    const kv = await getKv();
    let userCount = 0, postCount = 0, replyCount = 0;
    const users = [];
    const posts = [];
    const userEntries = kv.list({
      prefix: ["users"]
    }, {
      limit: 200
    });
    for await (const entry of userEntries) {
      userCount++;
      if (tab === "users") users.push(entry.value);
    }
    const postEntries = kv.list({
      prefix: ["posts_latest"]
    }, {
      limit: 200
    });
    for await (const entry of postEntries) {
      postCount++;
      const pe = await kv.get(["posts", entry.value]);
      if (pe.value) {
        if (tab === "posts") posts.push(pe.value);
        replyCount += pe.value.replyCount;
      }
    }
    return {
      data: {
        tab,
        userCount,
        postCount,
        replyCount,
        users,
        posts
      }
    };
  }
});
const index = define.page(function AdminPage({
  data
}) {
  const {
    tab,
    userCount,
    postCount,
    replyCount,
    users,
    posts
  } = data;
  return a($$_tpl_1, l("style", {
    padding: "var(--space-md) 0"
  }), l("style", {
    marginBottom: "var(--space-md)"
  }), u("a", {
    href: "/admin?tab=overview",
    class: `tab ${tab === "overview" ? "active" : ""}`,
    children: "📊 数据概览"
  }), u("a", {
    href: "/admin?tab=users",
    class: `tab ${tab === "users" ? "active" : ""}`,
    children: "👥 用户管理"
  }), u("a", {
    href: "/admin?tab=posts",
    class: `tab ${tab === "posts" ? "active" : ""}`,
    children: "📝 帖子管理"
  }), s(tab === "overview" && a($$_tpl_2, s(userCount), s(postCount), s(replyCount))), s(tab === "users" && a($$_tpl_3, l("style", {
    overflowX: "auto"
  }), s(users.map((u$1) => a($$_tpl_4, l("key", u$1.id), u("a", {
    href: `/user/${u$1.id}`,
    children: u$1.username
  }), l("style", {
    color: "var(--text-tertiary)"
  }), s(u$1.email), l("class", `user-badge ${u$1.role === "admin" ? "admin" : ""}`), s(u$1.role === "admin" ? "管理员" : "用户"), s(u$1.banned ? a($$_tpl_5, l("style", {
    color: "var(--danger)"
  })) : a($$_tpl_6, l("style", {
    color: "var(--success)"
  }))), l("style", {
    color: "var(--text-tertiary)"
  }), s(timeAgo(u$1.createdAt)), s(u$1.role !== "admin" && a($$_tpl_7, l("style", {
    display: "inline"
  }), l("value", u$1.id), l("value", u$1.banned ? "unban" : "ban"), l("class", `btn btn-sm ${u$1.banned ? "btn-secondary" : "btn-danger"}`), s(u$1.banned ? "解禁" : "禁言")))))))), s(tab === "posts" && a($$_tpl_8, l("style", {
    overflowX: "auto"
  }), s(posts.map((p) => a($$_tpl_9, l("key", p.id), u("a", {
    href: `/post/${p.id}`,
    children: p.title.length > 30 ? p.title.slice(0, 30) + "..." : p.title
  }), s(p.boardSlug), s(p.authorName), s(p.replyCount), s(p.likeCount), l("style", {
    color: "var(--text-tertiary)"
  }), s(timeAgo(p.createdAt)), l("style", {
    display: "inline"
  }), l("value", p.id)))))));
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___admin_index = index;
export {
  config,
  css,
  _freshRoute___admin_index as default,
  handler,
  handlers
};
