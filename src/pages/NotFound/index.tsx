import { Link } from 'react-router-dom';

/**
 * 404 页面
 */
function NotFound() {
  return (
    <section style={{ padding: 24 }}>
      <h1>404</h1>
      <p>页面不存在</p>
      <Link to="/">返回首页</Link>
    </section>
  );
}

export default NotFound;
