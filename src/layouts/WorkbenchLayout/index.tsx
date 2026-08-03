import { Link, Outlet } from 'react-router-dom';
import styles from './index.less';

/**
 * 工作台 Layout：简易顶栏 + 静态侧栏 + 内容区 Outlet
 */
function WorkbenchLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>工作台</h1>
        <Link className={styles.homeLink} to="/">
          返回首页
        </Link>
      </header>
      <div className={styles.body}>
        <aside className={styles.sider}>
          <Link className={styles.siderLink} to="/workbench">
            工作台首页
          </Link>
          <span className={styles.siderItem}>占位菜单 A</span>
          <span className={styles.siderItem}>占位菜单 B</span>
        </aside>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default WorkbenchLayout;
