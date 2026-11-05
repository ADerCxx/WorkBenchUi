import RouteFallback from '@/router/RouteFallback';
import { mainMenu } from '@/router/menu';
import { PATHS } from '@/router/paths';
import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import styles from './index.less';

/**
 * 主站 Layout：左侧 Logo+导航，右侧进入工作台 CTA，子路由出口
 *
 * Suspense 放在这里而不是每个路由 element 上：
 * 新增页面时**不可能忘记**挂 fallback，避免出现加载白屏。
 */
function MainLayout() {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <Link
            to={PATHS.home}
            className={styles.brand}
            aria-label="fabric 首页"
          >
            <img
              className={styles.logo}
              src={`${import.meta.env.BASE_URL}fabricIcon.png`}
              alt="fabric"
            />
          </Link>
          {mainMenu.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </div>
        <Link to={PATHS.workbench} className={styles.cta}>
          进入工作台
          <span className={styles.ctaArrow} aria-hidden>
            ↗
          </span>
        </Link>
      </nav>
      <main className={styles.main}>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

export default MainLayout;
