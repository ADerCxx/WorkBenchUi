import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { TooltipProps } from 'antd';
import { Tooltip } from 'antd';
import { useState } from 'react';
import CatalogTree from '../CatalogTree';
import styles from './index.less';
import type { CatalogSidebarProps } from './types';

export type { CatalogSidebarProps } from './types';

/** 半透明黑底圆角悬浮标签（对抗 antd cssinjs 用 styles） */
const darkTooltipStyles: TooltipProps['styles'] = {
  container: {
    padding: '6px 10px',
    color: '#fff',
    fontSize: 12,
    lineHeight: 1.4,
    background: 'rgba(0, 0, 0, 0.72)',
    borderRadius: 8,
    boxShadow: 'none',
    minHeight: 'auto',
  },
};

/**
 * 目录侧栏壳：展开/收起宽度 + 交界中部把手；内部组合 CatalogTree。
 */
function CatalogSidebar(props: CatalogSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleLabel = collapsed ? '展开目录侧栏' : '收起目录侧栏';

  return (
    <div
      className={`${styles.root}${collapsed ? ` ${styles.rootCollapsed}` : ''}`}
    >
      <div
        className={`${styles.body}${collapsed ? ` ${styles.bodyHidden}` : ''}`}
      >
        <CatalogTree {...props} />
      </div>
      <Tooltip
        title={toggleLabel}
        placement="right"
        arrow={false}
        styles={darkTooltipStyles}
      >
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={!collapsed}
          aria-label={toggleLabel}
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? (
            <RightOutlined aria-hidden />
          ) : (
            <LeftOutlined aria-hidden />
          )}
        </button>
      </Tooltip>
    </div>
  );
}

export default CatalogSidebar;
