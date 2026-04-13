import { d as define, a, u, l, s, i as createUser, f as createSession, h as createSessionCookie } from "../server-entry.mjs";
const $$_tpl_1 = ['<div class="auth-page"><div class="auth-card card"><div class="card-body"><h1 class="auth-title">注册 DeLinux</h1>', '<form method="POST"><div class="form-group"><label class="form-label" for="username">用户名</label><input class="form-input" type="text" id="username" name="username" ', ' placeholder="2-20 个字符" required autofocus></div><div class="form-group"><label class="form-label" for="email">邮箱</label><input class="form-input" type="email" id="email" name="email" ', ' placeholder="your@email.com" required></div><div class="form-group"><label class="form-label" for="password">密码</label><input class="form-input" type="password" id="password" name="password" placeholder="至少 6 个字符" required></div><div class="form-group"><label class="form-label" for="confirmPassword">确认密码</label><input class="form-input" type="password" id="confirmPassword" name="confirmPassword" placeholder="再次输入密码" required></div><button type="submit" class="btn btn-primary" ', '>注册</button></form><p class="auth-footer">已有账号？', "</p></div></div></div>"];
const $$_tpl_2 = ['<div class="alert alert-error">', "</div>"];
const handler$1 = define.handlers({
  GET(ctx) {
    if (ctx.state.user) {
      return new Response(null, {
        status: 302,
        headers: {
          location: "/"
        }
      });
    }
    return {
      data: {
        error: "",
        username: "",
        email: ""
      }
    };
  },
  async POST(ctx) {
    if (ctx.state.user) {
      return new Response(null, {
        status: 302,
        headers: {
          location: "/"
        }
      });
    }
    const form = await ctx.req.formData();
    const username = (form.get("username") || "").trim();
    const email = (form.get("email") || "").trim();
    const password = form.get("password") || "";
    const confirmPassword = form.get("confirmPassword") || "";
    let error = "";
    if (!username || !email || !password) error = "请填写所有字段";
    else if (username.length < 2 || username.length > 20) error = "用户名长度需在 2-20 个字符之间";
    else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) error = "用户名只能包含字母、数字、下划线和中文";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = "请输入有效的邮箱地址";
    else if (password.length < 6) error = "密码长度至少 6 个字符";
    else if (password !== confirmPassword) error = "两次输入的密码不一致";
    else {
      const result = await createUser(username, email, password);
      if (!result.ok) {
        error = result.error || "注册失败";
      } else {
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
        username,
        email
      }
    };
  }
});
const register = define.page(function Register({
  data
}) {
  const {
    error,
    username,
    email
  } = data;
  return a($$_tpl_1, s(error && a($$_tpl_2, s(error))), l("value", username), l("value", email), l("style", {
    width: "100%"
  }), u("a", {
    href: "/auth/login",
    children: "登录"
  }));
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___auth_register = register;
export {
  config,
  css,
  _freshRoute___auth_register as default,
  handler,
  handlers
};
