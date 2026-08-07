import FabricLoading from '@/components/FabricLoading';
import {
  FileMarkdownOutlined,
  FolderOpenOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import type { TooltipProps } from 'antd';
import { Empty, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import styles from './index.less';
import type { CatalogTreeProps } from './types';

export type { CatalogTreeProps } from './types';

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

function renderTreeIcon(props: { isLeaf?: boolean; expanded?: boolean }) {
  if (props.isLeaf) {
    return <FileMarkdownOutlined />;
  }
  return props.expanded ? <FolderOpenOutlined /> : <FolderOutlined />;
}

function renderTreeTitle(node: DataNode) {
  const title =
    typeof node.title === 'string' ? node.title : String(node.title ?? '');
  return (
    <Typography.Text
      className={styles.nodeTitle}
      ellipsis={{
        tooltip: {
          arrow: false,
          styles: darkTooltipStyles,
        },
      }}
    >
      {title}
    </Typography.Text>
  );
}

/**
 * 左侧目录树；仅叶子可选中。
 */
function CatalogTree({
  hasPicked,
  loading,
  treeData,
  selectedPath,
  onSelectFile,
  emptyDescription = '未扫描到匹配的白名单文件',
}: CatalogTreeProps) {
  if (loading) {
    return (
      <div className={styles.loading}>
        <FabricLoading size="sm" />
      </div>
    );
  }

  if (!hasPicked) {
    return (
      <Empty
        className={styles.empty}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="请先选择项目根目录"
      />
    );
  }

  if (treeData.length === 0) {
    return (
      <Empty
        className={styles.empty}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={emptyDescription}
      />
    );
  }

  const defaultExpandedKeys = treeData.map((n) => n.key);

  return (
    <Tree
      className={styles.tree}
      key={treeData.map((n) => n.key).join('|')}
      treeData={treeData}
      blockNode
      selectedKeys={selectedPath ? [selectedPath] : []}
      defaultExpandedKeys={defaultExpandedKeys}
      showIcon
      icon={renderTreeIcon}
      titleRender={renderTreeTitle}
      onSelect={(keys, info) => {
        if (!info.node.isLeaf) return;
        const key = String(keys[0] ?? '');
        if (key) onSelectFile(key);
      }}
    />
  );
}

export default CatalogTree;
