import MarkdownPreview from '@/components/MarkdownPreview';
import { Empty, Segmented, Typography } from 'antd';
import { useState } from 'react';
import styles from './index.less';
import type { PreviewMode, PreviewPaneProps } from './types';

export type { PreviewMode, PreviewPaneProps } from './types';

/**
 * 工作台右侧预览壳：顶栏 path + 模式切换；Markdown / 原文
 */
function PreviewPane({ path, content }: PreviewPaneProps) {
  const [mode, setMode] = useState<PreviewMode>('markdown');

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
      <div className={styles.toolbar}>
        <Typography.Text code className={styles.path}>
          {path}
        </Typography.Text>
        <Segmented
          value={mode}
          onChange={(value) => setMode(value as PreviewMode)}
          options={[
            { label: 'Markdown', value: 'markdown' },
            { label: '原文', value: 'raw' },
          ]}
        />
      </div>
      <div className={styles.body}>
        {mode === 'markdown' ? (
          <MarkdownPreview source={content} />
        ) : (
          <pre className={styles.raw}>{content}</pre>
        )}
      </div>
    </div>
  );
}

export default PreviewPane;
