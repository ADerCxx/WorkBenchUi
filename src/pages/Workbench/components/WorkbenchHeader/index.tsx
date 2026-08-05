import { ExperimentOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import styles from './index.less';
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
    <header className={styles.header}>
      <div className={styles.brandRow}>
        <div className={styles.brand}>
          <img
            className={styles.logo}
            src={`${import.meta.env.BASE_URL}fabricIcon.png`}
            alt=""
          />
          <Typography.Title level={4} className={styles.title}>
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
