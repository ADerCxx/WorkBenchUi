import { Empty, Spin, Tree } from 'antd';
import type { CatalogTreeProps } from './types';

export type { CatalogTreeProps } from './types';

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
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (!hasPicked) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="请先选择项目根目录"
        style={{ marginTop: 48 }}
      />
    );
  }

  if (treeData.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={emptyDescription}
        style={{ marginTop: 48 }}
      />
    );
  }

  const defaultExpandedKeys = treeData.map((n) => n.key);

  return (
    <Tree
      key={treeData.map((n) => n.key).join('|')}
      treeData={treeData}
      selectedKeys={selectedPath ? [selectedPath] : []}
      defaultExpandedKeys={defaultExpandedKeys}
      onSelect={(keys, info) => {
        if (!info.node.isLeaf) return;
        const key = String(keys[0] ?? '');
        if (key) onSelectFile(key);
      }}
      style={{ padding: 8 }}
    />
  );
}

export default CatalogTree;
