import { PATHS } from '@/router/paths';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import styles from './index.less';

interface ErrorDescription {
  heading: string;
  detail: string;
}

/**
 * 把路由上下文里的未知错误翻译成用户能读懂的文案。
 * 分类顺序：HTTP 响应类 → JS 异常 → 兜底。
 */
function describeError(error: unknown): ErrorDescription {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return { heading: '404', detail: '页面不存在或已被移除' };
    }
    if (error.status === 401 || error.status === 403) {
      return { heading: String(error.status), detail: '没有访问该页面的权限' };
    }
    return {
      heading: String(error.status),
      detail: error.statusText || '请求未能完成',
    };
  }
  if (error instanceof Error) {
    return { heading: '页面出错了', detail: error.message };
  }
  return { heading: '页面出错了', detail: '发生了未知错误' };
}

/**
 * 路由级错误兜底页。
 *
 * 由 `<Route errorElement={<RouteError />} />` 挂载：
 * 页面组件渲染期抛错、loader 抛错时，React Router 会用它替换子树，
 * 避免冒泡到框架默认错误页（生产环境表现为白屏）。
 */
function RouteError() {
  const error = useRouteError();
  const { heading, detail } = describeError(error);

  return (
    <section className={styles.page}>
      <h1 className={styles.heading}>{heading}</h1>
      <p className={styles.detail}>{detail}</p>
      {import.meta.env.DEV && error instanceof Error && error.stack ? (
        <pre className={styles.stack}>{error.stack}</pre>
      ) : null}
      <Link to={PATHS.home}>返回首页</Link>
    </section>
  );
}

export default RouteError;
