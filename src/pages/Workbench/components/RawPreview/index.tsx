import { Empty, Typography } from 'antd';
import type { RawPreviewProps } from './types';

export type { RawPreviewProps } from './types';

/**
 * 右侧原文预览（非 Markdown 渲染）
 */
function RawPreview({ path, content }: RawPreviewProps) {
  if (!path || content === null) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="从左侧选择文件"
        style={{ marginTop: 80 }}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <Typography.Text
        code
        style={{
          display: 'block',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          wordBreak: 'break-all',
        }}
      >
        {path}
      </Typography.Text>
      <pre
        style={{
          margin: 0,
          padding: 12,
          flex: 1,
          overflow: 'auto',
          fontFamily: 'var(--mono)',
          fontSize: 13,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content}
      </pre>
    </div>
  );
}

export default RawPreview;
