import { Suspense, useEffect } from 'react';
import { Outlet, useMatches } from 'react-router-dom';
import RouteFallback from '../RouteFallback';
import type { RouteMeta } from '../types';

const SITE_NAME = 'Fabric';

/**
 * 根布局路由（无 path，不渲染任何可见 UI）。
 *
 * 职责有二：
 * 1. 同步 `document.title`：取**最深一条**带 handle.title 的匹配，实现子路由覆盖父路由；
 * 2. 提供最外层 Suspense 边界：让根级兜底路由（如全局 404）也能安全懒加载。
 *
 * 放在这里而不是每个页面里，是为了让新增页面**不可能忘记**这两件事。
 */
function MetaSync() {
  const matches = useMatches();
  // 最深匹配在数组末尾，倒序找第一条带 title 的
  const title = matches
    .map((match) => (match.handle as RouteMeta | undefined)?.title)
    .filter((value): value is string => Boolean(value))
    .pop();

  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  }, [title]);

  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  );
}

export default MetaSync;
