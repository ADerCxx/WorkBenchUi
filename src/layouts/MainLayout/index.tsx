import { Link, Outlet } from 'react-router-dom';
import styles from './index.less';

/**
 * 主站 Layout：顶部导航 + 子路由出口
 */
function MainLayout() {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <Link to="/">首页</Link>
        <Link to="/workbench">工作台</Link>
        <Link to="/regex-settings">正则设置</Link>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
