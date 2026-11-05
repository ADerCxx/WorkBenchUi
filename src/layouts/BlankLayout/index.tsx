import RouteFallback from '@/router/RouteFallback';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './index.less';

/**
 * 空白 Layout：无导航，供登录/全屏等页挂载
 *
 * 同样在 Outlet 外提供 Suspense 边界，与本区域的懒加载页面配套。
 */
function BlankLayout() {
  return (
    <div className={styles.shell}>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

export default BlankLayout;
