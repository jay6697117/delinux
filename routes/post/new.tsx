// 发帖页面

import { define } from "../../utils.ts";
import { BOARDS } from "../../utils/boards.ts";
import { createPost } from "../../utils/posts.ts";

export const handler = define.handlers({
  GET(ctx) {
    if (!ctx.state.user) {
      return new Response(null, {
        status: 302,
        headers: { location: "/auth/login" },
      });
    }
    const url = new URL(ctx.req.url);
    return {
      data: {
        error: "",
        board: url.searchParams.get("board") || "",
        title: "",
        content: "",
      },
    };
  },
  async POST(ctx) {
    if (!ctx.state.user) {
      return new Response(null, {
        status: 302,
        headers: { location: "/auth/login" },
      });
    }
    const form = await ctx.req.formData();
    const board = (form.get("board") as string || "").trim();
    const title = (form.get("title") as string || "").trim();
    const content = (form.get("content") as string || "").trim();
    let error = "";
    if (!board) error = "请选择版块";
    else if (!BOARDS.find((b) => b.slug === board)) error = "无效的版块";
    else if (!title || title.length < 2) error = "标题至少 2 个字符";
    else if (title.length > 100) error = "标题不能超过 100 个字符";
    else if (!content) error = "请填写帖子内容";
    else if (content.length > 10000) error = "内容不能超过 10000 个字符";
    else {
      const post = await createPost(
        title,
        content,
        ctx.state.user.id,
        ctx.state.user.username,
        board,
      );
      return new Response(null, {
        status: 302,
        headers: { location: `/post/${post.id}` },
      });
    }
    return { data: { error, board, title, content } };
  },
});

export default define.page<typeof handler>(function NewPost({ data }) {
  const { error, board, title, content } = data;
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
                  <option value={b.slug} selected={b.slug === board}>
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
              >
                {content}
              </textarea>
              <p class="form-hint">
                支持 Markdown 语法：**粗体**、*斜体*、`代码`、&gt; 引用、- 列表
              </p>
            </div>
            <button
              type="submit"
              class="btn btn-primary"
              style={{ width: "100%" }}
            >
              发布帖子
            </button>
          </form>
        </div>
      </div>
    </div>
  );
});
