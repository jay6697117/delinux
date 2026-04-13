import { d as define, a, u, l, s, c as loginUser, e as createSession, f as createSessionCookie } from "../server-entry.mjs";
const $$_tpl_1 = ['<div class="auth-page"><div class="auth-card card"><div class="card-body"><h1 class="auth-title">登录 DeLinux</h1>', '<form method="POST"><div class="form-group"><label class="form-label" for="email">邮箱</label><input class="form-input" type="email" id="email" name="email" ', ' placeholder="your@email.com" required autofocus></div><div class="form-group"><label class="form-label" for="password">密码</label><input class="form-input" type="password" id="password" name="password" placeholder="输入密码" required></div><button type="submit" class="btn btn-primary" ', '>登录</button></form><p class="auth-footer">没有账号？', "</p></div></div></div>"];
const $$_tpl_2 = ['<div class="alert alert-error">', "</div>"];
const handler$1 = define.handlers({
  GET(ctx) {
    if (ctx.state.user) return new Response(null, {
      status: 302,
      headers: {
        location: "/"
      }
    });
    return {
      data: {
        error: "",
        email: ""
      }
    };
  },
  async POST(ctx) {
    if (ctx.state.user) return new Response(null, {
      status: 302,
      headers: {
        location: "/"
      }
    });
    const form = await ctx.req.formData();
    const email = (form.get("email") || "").trim();
    const password = form.get("password") || "";
    let error = "";
    if (!email || !password) error = "请填写邮箱和密码";
    else {
      const result = await loginUser(email, password);
      if (!result.ok) error = result.error || "登录失败";
      else {
        const sessionId = await createSession(result.user.id);
        return new Response(null, {
          status: 302,
          headers: {
            location: "/",
            "set-cookie": createSessionCookie(sessionId)
          }
        });
      }
    }
    return {
      data: {
        error,
        email
      }
    };
  }
});
const login = define.page(function Login({
  data
}) {
  const {
    error,
    email
  } = data;
  return a($$_tpl_1, s(error && a($$_tpl_2, s(error))), l("value", email), l("style", {
    width: "100%"
  }), u("a", {
    href: "/auth/register",
    children: "注册"
  }));
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___auth_login = login;
export {
  config,
  css,
  _freshRoute___auth_login as default,
  handler,
  handlers
};
