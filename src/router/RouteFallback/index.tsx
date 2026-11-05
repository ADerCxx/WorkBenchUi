import FabricLoading from '@/components/FabricLoading';
import styles from './index.less';

/**
 * 路由懒加载统一占位。
 *
 * 页面首屏代码下载完成前的过渡形态，避免出现无反馈的白屏。
 * 供 MetaSync 与各 Layout 的 `<Suspense fallback>` 复用。
 */
function RouteFallback() {
  return (
    <div className={styles.fallback}>
      <FabricLoading size="md" />
    </div>
  );
}

export default RouteFallback;
