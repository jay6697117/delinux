// 全局应用状态类型定义

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  createdAt: number;
  banned: boolean;
}

// 不含密码的用户信息（传递给前端）
export interface UserPublic {
  id: string;
  username: string;
  role: "user" | "admin";
  createdAt: number;
  banned: boolean;
}

export interface Board {
  slug: string;
  name: string;
  description: string;
  icon: string;
  postCount: number;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  boardSlug: string;
  createdAt: number;
  lastReplyAt: number;
  replyCount: number;
  likeCount: number;
}

export interface Reply {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: number;
}

export interface Session {
  userId: string;
  createdAt: number;
  expiresAt: number;
}

// Fresh 中间件传递的全局状态
export interface State {
  user?: UserPublic;
  sessionId?: string;
}
