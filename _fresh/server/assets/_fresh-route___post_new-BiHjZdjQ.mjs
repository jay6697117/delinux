import { d as define, a, l, s, B as BOARDS } from "../server-entry.mjs";
import { c as createPost } from "./posts-CtOzPUAj.mjs";
const $$_tpl_1 = ['<div class="auth-page"><div class="card" ', '><div class="card-body"><h1 class="auth-title">✍️ 发帖</h1>', '<form method="POST"><div class="form-group"><label class="form-label" for="board">选择版块</label><select class="form-input" id="board" name="board" required><option value="">-- 请选择 --</option>', '</select></div><div class="form-group"><label class="form-label" for="title">标题</label><input class="form-input" type="text" id="title" name="title" ', ' placeholder="一句话概括你想说的" required autofocus></div><div class="form-group"><label class="form-label" for="content">内容</label><textarea class="form-input" id="content" name="content" placeholder="支持 Markdown 格式" required>', '</textarea><p class="form-hint">支持 Markdown 语法：**粗体**、*斜体*、`代码`、&gt; 引用、- 列表</p></div><button type="submit" class="btn btn-primary" ', ">发布帖子</button></form></div></div></div>"];
const $$_tpl_2 = ['<div class="alert alert-error">', "</div>"];
const $$_tpl_3 = ["<option ", " ", ">", " ", "</option>"];
const handler$1 = define.handlers({
  GET(ctx) {
    if (!ctx.state.user) return new Response(null, {
      status: 302,
      headers: {
        location: "/auth/login"
      }
    });
    const url = new URL(ctx.req.url);
    return {
      data: {
        error: "",
        board: url.searchParams.get("board") || "",
        title: "",
        content: ""
      }
    };
  },
  async POST(ctx) {
    if (!ctx.state.user) return new Response(null, {
      status: 302,
      headers: {
        location: "/auth/login"
      }
    });
    const form = await ctx.req.formData();
    const board = (form.get("board") || "").trim();
    const title = (form.get("title") || "").trim();
    const content = (form.get("content") || "").trim();
    let error = "";
    if (!board) error = "请选择版块";
    else if (!BOARDS.find((b) => b.slug === board)) error = "无效的版块";
    else if (!title || title.length < 2) error = "标题至少 2 个字符";
    else if (title.length > 100) error = "标题不能超过 100 个字符";
    else if (!content) error = "请填写帖子内容";
    else if (content.length > 1e4) error = "内容不能超过 10000 个字符";
    else {
      const post = await createPost(title, content, ctx.state.user.id, ctx.state.user.username, board);
      return new Response(null, {
        status: 302,
        headers: {
          location: `/post/${post.id}`
        }
      });
    }
    return {
      data: {
        error,
        board,
        title,
        content
      }
    };
  }
});
const _new = define.page(function NewPost({
  data
}) {
  const {
    error,
    board,
    title,
    content
  } = data;
  return a($$_tpl_1, l("style", {
    width: "100%",
    maxWidth: "700px"
  }), s(error && a($$_tpl_2, s(error))), s(BOARDS.map((b) => a($$_tpl_3, l("value", b.slug), b.slug === board ? "selected" : "", s(b.icon), s(b.name)))), l("value", title), s(content), l("style", {
    width: "100%"
  }));
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___post_new = _new;
export {
  config,
  css,
  _freshRoute___post_new as default,
  handler,
  handlers
};
