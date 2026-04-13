// 500 错误页面

import { define } from "../utils.ts";

export default define.page(function Error500() {
  return (
    <div class="auth-page">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "5rem", marginBottom: "var(--space-md)" }}>⚠️</div>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "var(--space-md)" }}>
          500 — 服务器错误
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-lg)", fontSize: "1rem" }}>
          抱歉，服务器遇到了问题，请稍后再试
        </p>
        <a href="/" class="btn btn-primary" style={{ fontSize: "1rem", padding: "8px 24px" }}>
          返回首页
        </a>
      </div>
    </div>
  );
});
