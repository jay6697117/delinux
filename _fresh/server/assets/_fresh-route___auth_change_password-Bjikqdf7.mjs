import { d as define, a, u, s, l, h as changePassword$1 } from "../server-entry.mjs";
const $$_tpl_1 = ['<div class="auth-page"><div class="auth-card card"><div class="card-body"><h1 class="auth-title">修改密码</h1>', "", "", '<p class="auth-footer">', "</p></div></div></div>"];
const $$_tpl_2 = ['<div class="alert alert-success">✅ 密码修改成功！', "</div>"];
const $$_tpl_3 = ['<div class="alert alert-error">', "</div>"];
const $$_tpl_4 = ['<form method="POST"><div class="form-group"><label class="form-label" for="oldPassword">当前密码</label><input class="form-input" type="password" id="oldPassword" name="oldPassword" placeholder="输入当前密码" required autofocus></div><div class="form-group"><label class="form-label" for="newPassword">新密码</label><input class="form-input" type="password" id="newPassword" name="newPassword" placeholder="至少 6 个字符" required></div><div class="form-group"><label class="form-label" for="confirmPassword">确认新密码</label><input class="form-input" type="password" id="confirmPassword" name="confirmPassword" placeholder="再次输入新密码" required></div><button type="submit" class="btn btn-primary" ', ">确认修改</button></form>"];
const handler$1 = define.handlers({
  GET(ctx) {
    if (!ctx.state.user) {
      return new Response(null, {
        status: 302,
        headers: {
          location: "/auth/login"
        }
      });
    }
    return {
      data: {
        error: "",
        success: false
      }
    };
  },
  async POST(ctx) {
    if (!ctx.state.user) {
      return new Response(null, {
        status: 302,
        headers: {
          location: "/auth/login"
        }
      });
    }
    const form = await ctx.req.formData();
    const oldPassword = form.get("oldPassword") || "";
    const newPassword = form.get("newPassword") || "";
    const confirmPassword = form.get("confirmPassword") || "";
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
      const result = await changePassword$1(ctx.state.user.id, oldPassword, newPassword);
      if (!result.ok) {
        error = result.error || "修改失败";
      } else {
        return {
          data: {
            error: "",
            success: true
          }
        };
      }
    }
    return {
      data: {
        error,
        success: false
      }
    };
  }
});
const changePassword = define.page(function ChangePassword({
  data
}) {
  const {
    error,
    success
  } = data;
  return a($$_tpl_1, s(success && a($$_tpl_2, u("a", {
    href: "/",
    style: {
      marginLeft: "8px",
      color: "inherit",
      textDecoration: "underline"
    },
    children: "返回首页"
  }))), s(error && a($$_tpl_3, s(error))), s(!success && a($$_tpl_4, l("style", {
    width: "100%"
  }))), u("a", {
    href: "/",
    children: "返回首页"
  }));
});
const routeCss = null;
const css = routeCss;
const config = void 0;
const handler = handler$1;
const handlers = void 0;
const _freshRoute___auth_change_password = changePassword;
export {
  config,
  css,
  _freshRoute___auth_change_password as default,
  handler,
  handlers
};
