import { Empty, Typography } from 'antd';
import styles from './index.less';
import type { RawPreviewProps } from './types';

export type { RawPreviewProps } from './types';

/**
 * 右侧原文预览（非 Markdown 渲染）
 */
function RawPreview({ path, content }: RawPreviewProps) {
  if (!path || content === null) {
    return (
      <Empty
        className={styles.empty}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="从左侧选择文件"
      />
    );
  }

  return (
    <div className={styles.root}>
      <Typography.Text code className={styles.path}>
        {path}
      </Typography.Text>
      <pre className={styles.content}>{content}</pre>
    </div>
  );
}

export default RawPreview;
