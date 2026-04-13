// 版块数据定义（静态常量，无需数据库）

import type { Board } from "./state.ts";

// 预定义的版块列表
export const BOARDS: Board[] = [
  {
    slug: "ai",
    name: "AI",
    description: "AI 技术讨论、模型分享、工具推荐",
    icon: "🤖",
    postCount: 0,
  },
  {
    slug: "chill",
    name: "摸鱼",
    description: "日常闲聊、轻松话题",
    icon: "🐟",
    postCount: 0,
  },
  {
    slug: "deals",
    name: "羊毛",
    description: "优惠信息、薅羊毛攻略",
    icon: "🐑",
    postCount: 0,
  },
  {
    slug: "share",
    name: "分享",
    description: "资源分享、经验心得",
    icon: "📢",
    postCount: 0,
  },
  {
    slug: "team",
    name: "组队",
    description: "拼车、合作、找搭档",
    icon: "🤝",
    postCount: 0,
  },
];

// 预构建 slug → Board 只读映射，O(1) 查找替代 boards.find()
const BOARD_BY_SLUG: ReadonlyMap<string, Board> = new Map(
  BOARDS.map((b) => [b.slug, b]),
);

// 按 slug 查找版块（O(1)）
export function getBoardBySlug(slug: string): Board | undefined {
  return BOARD_BY_SLUG.get(slug);
}

// 获取所有版块
export function getAllBoards(): Board[] {
  return BOARDS;
}
