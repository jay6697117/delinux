// 发帖页面

import type { RouteContext } from "fresh";
import type { State } from "../../utils/state.ts";
import { BOARDS } from "../../utils/boards.ts";
import { createPost } from "../../utils/posts.ts";

export default async function NewPost(req: Request, ctx: RouteContext<void, State>) {
  // 未登录跳转
  if (!ctx.state.user) {
    return new Response(null, { status: 302, headers: { location: "/auth/login" } });
  }

  const url = new URL(req.url);
  let selectedBoard = url.searchParams.get("board") || "";
  let title = "";
  let content = "";
  let error = "";

  if (req.method === "POST") {
    const form = await req.formData();
    selectedBoard = (form.get("board") as string || "").trim();
    title = (form.get("title") as string || "").trim();
    content = (form.get("content") as string || "").trim();

    if (!selectedBoard) {
      error = "请选择版块";
    } else if (!BOARDS.find(b => b.slug === selectedBoard)) {
      error = "无效的版块";
    } else if (!title || title.length < 2) {
      error = "标题至少 2 个字符";
    } else if (title.length > 100) {
      error = "标题不能超过 100 个字符";
    } else if (!content) {
      error = "请填写帖子内容";
    } else if (content.length > 10000) {
      error = "内容不能超过 10000 个字符";
    } else {
      const post = await createPost(
        title,
        content,
        ctx.state.user.id,
        ctx.state.user.username,
        selectedBoard,
      );
      return new Response(null, {
        status: 302,
        headers: { location: `/post/${post.id}` },
      });
    }
  }

  return (
    <div class="auth-page">
      <div class="card" style={{ width: "100%", maxWidth: "700px" }}>
        <div class="card-body">
          <h1 class="auth-title">✍️ 发帖</h1>

          {error && <div class="alert alert-error">{error}</div>}

          <form method="POST">
            <div class="form-group">
              <label class="form-label" for="board">选择版块</label>
              <select class="form-input" id="board" name="board" required>
                <option value="">-- 请选择 --</option>
                {BOARDS.map((b) => (
                  <option value={b.slug} selected={b.slug === selectedBoard}>
                    {b.icon} {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="title">标题</label>
              <input
                class="form-input"
                type="text"
                id="title"
                name="title"
                value={title}
                placeholder="一句话概括你想说的"
                required
                autofocus
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="content">内容</label>
              <textarea
                class="form-input"
                id="content"
                name="content"
                placeholder="支持 Markdown 格式"
                required
              >{content}</textarea>
              <p class="form-hint">支持 Markdown 语法：**粗体**、*斜体*、`代码`、> 引用、- 列表</p>
            </div>

            <button type="submit" class="btn btn-primary" style={{ width: "100%" }}>
              发布帖子
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
