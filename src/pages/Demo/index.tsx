import { Link } from 'react-router-dom';

/**
 * 路由示例页，用于验证客户端跳转
 */
function Demo() {
  return (
    <section style={{ padding: 24 }}>
      <h1>Demo</h1>
      <p>这是路由示例页，用于验证客户端跳转。</p>
      <Link to="/">返回首页</Link>
    </section>
  );
}

export default Demo;
