// 管理员禁言/解禁 API

import type { RouteContext } from "fresh";
import type { State, User } from "../../../utils/state.ts";
import { getKv } from "../../../utils/db.ts";

export default async function BanUserApi(req: Request, ctx: RouteContext<void, State>) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!ctx.state.user || ctx.state.user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const form = await req.formData();
  const userId = form.get("userId") as string;
  const action = form.get("action") as string; // "ban" 或 "unban"

  if (!userId || !action) {
    return new Response("Bad request", { status: 400 });
  }

  const kv = await getKv();
  const userEntry = await kv.get<User>(["users", userId]);
  if (!userEntry.value) {
    return new Response("User not found", { status: 404 });
  }

  const updatedUser: User = {
    ...userEntry.value,
    banned: action === "ban",
  };

  await kv.set(["users", userId], updatedUser);

  const referer = req.headers.get("referer") || "/admin";
  return new Response(null, { status: 302, headers: { location: referer } });
}
