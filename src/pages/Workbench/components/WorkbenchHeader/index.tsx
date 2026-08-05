import { ExperimentOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import type { WorkbenchHeaderProps } from './types';

export type { WorkbenchHeaderProps } from './types';

/**
 * 工作台顶栏：标题 + 选择文件夹 + 分析工具
 */
function WorkbenchHeader({
  rootName,
  loading,
  onPickFolder,
  analysisDisabled,
  onOpenAnalysis,
}: WorkbenchHeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}fabricIcon.png`}
            alt=""
            style={{
              display: 'block',
              height: 28,
              width: 'auto',
              flexShrink: 0,
            }}
          />
          <Typography.Title
            level={4}
            style={{
              margin: 0,
              lineHeight: '28px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            知识织物工作台
          </Typography.Title>
        </div>
        {rootName ? (
          <Typography.Text type="secondary">{rootName}</Typography.Text>
        ) : null}
      </div>
      <Space>
        <Button
          type="primary"
          icon={<FolderOpenOutlined />}
          loading={loading}
          onClick={onPickFolder}
        >
          选择文件夹
        </Button>
        <Button
          icon={<ExperimentOutlined />}
          disabled={analysisDisabled}
          onClick={onOpenAnalysis}
        >
          分析工具
        </Button>
      </Space>
    </header>
  );
}

export default WorkbenchHeader;
