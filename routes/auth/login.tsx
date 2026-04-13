// 登录页面

import { define } from "../../utils.ts";
import { loginUser, createSession, createSessionCookie } from "../../utils/auth.ts";

export const handler = define.handlers({
  GET(ctx) {
    if (ctx.state.user) return new Response(null, { status: 302, headers: { location: "/" } });
    return { data: { error: "", email: "" } };
  },

  async POST(ctx) {
    if (ctx.state.user) return new Response(null, { status: 302, headers: { location: "/" } });
    const form = await ctx.req.formData();
    const email = (form.get("email") as string || "").trim();
    const password = form.get("password") as string || "";
    let error = "";
    if (!email || !password) error = "请填写邮箱和密码";
    else {
      const result = await loginUser(email, password);
      if (!result.ok) error = result.error || "登录失败";
      else {
        const sessionId = await createSession(result.user!.id);
        return new Response(null, { status: 302, headers: { location: "/", "set-cookie": createSessionCookie(sessionId) } });
      }
    }
    return { data: { error, email } };
  },
});

export default define.page<typeof handler>(function Login({ data }) {
  const { error, email } = data;
  return (
    <div class="auth-page">
      <div class="auth-card card">
        <div class="card-body">
          <h1 class="auth-title">登录 DeLinux</h1>
          {error && <div class="alert alert-error">{error}</div>}
          <form method="POST">
            <div class="form-group">
              <label class="form-label" for="email">邮箱</label>
              <input class="form-input" type="email" id="email" name="email" value={email} placeholder="your@email.com" required autofocus />
            </div>
            <div class="form-group">
              <label class="form-label" for="password">密码</label>
              <input class="form-input" type="password" id="password" name="password" placeholder="输入密码" required />
            </div>
            <button type="submit" class="btn btn-primary" style={{ width: "100%" }}>登录</button>
          </form>
          <p class="auth-footer">没有账号？<a href="/auth/register">注册</a></p>
        </div>
      </div>
    </div>
  );
});
