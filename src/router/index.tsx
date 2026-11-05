import { createBrowserRouter } from 'react-router-dom';
import routes from './routes';

/**
 * 将 Vite BASE_URL 转为 react-router basename（无尾部斜杠；根路径不传）
 */
function getBasename(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') {
    return undefined;
  }
  return base.replace(/\/$/, '');
}

/**
 * 本文件只负责**创建 router 实例**。
 * 路由本身的结构、懒加载、元数据与兜底策略都在 `./routes.tsx`。
 */
export const router = createBrowserRouter(routes, { basename: getBasename() });
