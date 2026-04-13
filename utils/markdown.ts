// Markdown 渲染工具

import { marked } from "marked";

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

// 简单的 XSS 防护：转义危险的 HTML 标签
function sanitizeHtml(html: string): string {
  // 移除 script 标签及内容
  html = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
  // 移除 on* 事件属性
  html = html.replace(/\s+on\w+\s*=\s*['"][^'"]*['"]/gi, "");
  html = html.replace(/\s+on\w+\s*=\s*\S+/gi, "");
  // 移除 javascript: 协议
  html = html.replace(/href\s*=\s*['"]javascript:[^'"]*['"]/gi, 'href="#"');
  return html;
}

// 渲染 Markdown 为安全 HTML
export function renderMarkdown(text: string): string {
  const html = marked.parse(text) as string;
  return sanitizeHtml(html);
}
