import { Outlet } from 'react-router-dom';
import styles from './index.less';

/**
 * 空白 Layout：无导航，供登录/全屏等页挂载
 */
function BlankLayout() {
  return (
    <div className={styles.shell}>
      <Outlet />
    </div>
  );
}

export default BlankLayout;
