// 版块数据定义与初始化

import { getKv } from "./db.ts";
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

// 初始化版块数据到 KV
export async function initBoards(): Promise<void> {
  const kv = await getKv();
  for (const board of BOARDS) {
    const existing = await kv.get(["boards", board.slug]);
    if (!existing.value) {
      await kv.set(["boards", board.slug], board);
    }
  }
}

// 获取所有版块（直接返回静态常量，避免无意义的 KV 查询）
export function getAllBoards(): Board[] {
  return BOARDS;
}

// 获取单个版块
export async function getBoard(slug: string): Promise<Board | null> {
  const kv = await getKv();
  const entry = await kv.get<Board>(["boards", slug]);
  return entry.value;
}
