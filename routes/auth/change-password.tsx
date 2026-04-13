// 修改密码页面

import { define } from "../../utils.ts";
import { changePassword } from "../../utils/auth.ts";

export const handler = define.handlers({
  GET(ctx) {
    // 未登录用户跳转到登录页
    if (!ctx.state.user) {
      return new Response(null, {
        status: 302,
        headers: { location: "/auth/login" },
      });
    }
    return { data: { error: "", success: false } };
  },

  async POST(ctx) {
    if (!ctx.state.user) {
      return new Response(null, {
        status: 302,
        headers: { location: "/auth/login" },
      });
    }

    const form = await ctx.req.formData();
    const oldPassword = form.get("oldPassword") as string || "";
    const newPassword = form.get("newPassword") as string || "";
    const confirmPassword = form.get("confirmPassword") as string || "";

    let error = "";
    if (!oldPassword || !newPassword || !confirmPassword) {
      error = "请填写所有字段";
    } else if (newPassword.length < 6) {
      error = "新密码长度至少 6 个字符";
    } else if (newPassword !== confirmPassword) {
      error = "两次输入的新密码不一致";
    } else if (oldPassword === newPassword) {
      error = "新密码不能与当前密码相同";
    } else {
      const result = await changePassword(
        ctx.state.user.id,
        oldPassword,
        newPassword,
      );
      if (!result.ok) {
        error = result.error || "修改失败";
      } else {
        return { data: { error: "", success: true } };
      }
    }

    return { data: { error, success: false } };
  },
});

export default define.page<typeof handler>(function ChangePassword({ data }) {
  const { error, success } = data;
  return (
    <div class="auth-page">
      <div class="auth-card card">
        <div class="card-body">
          <h1 class="auth-title">修改密码</h1>
          {success && (
            <div class="alert alert-success">
              ✅ 密码修改成功！
              <a href="/" style={{ marginLeft: "8px", color: "inherit", textDecoration: "underline" }}>
                返回首页
              </a>
            </div>
          )}
          {error && <div class="alert alert-error">{error}</div>}
          {!success && (
            <form method="POST">
              <div class="form-group">
                <label class="form-label" for="oldPassword">当前密码</label>
                <input
                  class="form-input"
                  type="password"
                  id="oldPassword"
                  name="oldPassword"
                  placeholder="输入当前密码"
                  required
                  autofocus
                />
              </div>
              <div class="form-group">
                <label class="form-label" for="newPassword">新密码</label>
                <input
                  class="form-input"
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  placeholder="至少 6 个字符"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label" for="confirmPassword">
                  确认新密码
                </label>
                <input
                  class="form-input"
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="再次输入新密码"
                  required
                />
              </div>
              <button
                type="submit"
                class="btn btn-primary"
                style={{ width: "100%" }}
              >
                确认修改
              </button>
            </form>
          )}
          <p class="auth-footer">
            <a href="/">返回首页</a>
          </p>
        </div>
      </div>
    </div>
  );
});
