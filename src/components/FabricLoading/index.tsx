import styles from './index.less';
import type { FabricLoadingProps, FabricLoadingSize } from './types';

export type { FabricLoadingProps, FabricLoadingSize } from './types';

const SIZE_CLASS: Record<FabricLoadingSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const ICON_SRC = `${import.meta.env.BASE_URL}fabricIcon.png`;

/**
 * 品牌加载动画：fabricIcon 渐变扫光
 */
function FabricLoading({ size = 'md', className }: FabricLoadingProps) {
  const rootClassName = [styles.root, SIZE_CLASS[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={rootClassName} role="status" aria-label="加载中">
      <img className={styles.img} src={ICON_SRC} alt="" />
    </span>
  );
}

export default FabricLoading;
