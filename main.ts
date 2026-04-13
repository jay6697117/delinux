import { App, staticFiles } from "fresh";
import { type State } from "./utils/state.ts";

const app = new App<State>()
  .use(staticFiles());

// 文件路由
app.fsRoutes();

// 启动服务
if (import.meta.main) {
  await app.listen();
}

export default app;
