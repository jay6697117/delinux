// Fresh 2.0 工具：State 类型定义和 define helper

import { createDefine } from "fresh";

// 全局应用状态类型
export interface State {
  user?: {
    id: string;
    username: string;
    role: "user" | "admin";
    createdAt: number;
    banned: boolean;
  };
  sessionId?: string;
}

export const define = createDefine<State>();
