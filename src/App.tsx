import { Link, Outlet } from 'react-router-dom';
import styles from './App.less';

/**
 * 根布局：顶部导航 + 子路由出口
 */
function App() {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <Link to="/">首页</Link>
        <Link to="/demo">Demo</Link>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
