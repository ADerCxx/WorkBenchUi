import { Link } from 'react-router-dom';
import styles from './index.less';

/**
 * 404 页面
 */
function NotFound() {
  return (
    <section className={styles.page}>
      <h1>404</h1>
      <p>页面不存在</p>
      <Link to="/">返回首页</Link>
    </section>
  );
}

export default NotFound;
