import { Link, Outlet } from 'react-router-dom';
import styles from './index.less';

/**
 * 主站 Layout：左侧 Logo+导航，右侧进入工作台 CTA，子路由出口
 */
function MainLayout() {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <Link to="/" className={styles.brand} aria-label="fabric 首页">
            <img
              className={styles.logo}
              src={`${import.meta.env.BASE_URL}fabricIcon.png`}
              alt="fabric"
            />
          </Link>
          <Link to="/">首页</Link>
          <Link to="/workbench">工作台</Link>
          <Link to="/regex-settings">正则设置</Link>
        </div>
        <Link to="/workbench" className={styles.cta}>
          进入工作台
          <span className={styles.ctaArrow} aria-hidden>
            ↗
          </span>
        </Link>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
