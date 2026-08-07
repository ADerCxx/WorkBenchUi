import MarkdownPreview from '@/components/MarkdownPreview';
import { useAnalysisStream } from '@/hooks/useAnalysisStream';
import {
  CloseOutlined,
  ExpandOutlined,
  LoadingOutlined,
  MinusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Space, message } from 'antd';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Rnd } from 'react-rnd';
import styles from './index.less';
import {
  getDefaultPanelBounds,
  isPanelTooSmall,
  type PanelBounds,
} from './panelGeometry';
import RelationGraph from './RelationGraph';
import { parseGraphJson } from './RelationGraph/parseGraphJson';
import { getAnalyzeButtonLabel, getResultSubtitle } from './resultChrome';
import type { AnalysisPanelProps } from './types';

export type { AnalysisPanelMode, AnalysisPanelProps } from './types';

function readViewport(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 720 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * 分析工具浮窗：拖拽缩放、最小/全屏/关；左侧流式 Markdown 结果，右侧关系图谱
 */
function AnalysisPanel({
  mode,
  onModeChange,
  onClose,
  fileName,
  fileContent,
  knownPaths,
  onSelectFile,
}: AnalysisPanelProps) {
  const {
    start,
    abortAndCancel,
    status,
    markdown,
    errorMessage,
    renderCode,
    hasCompleted,
  } = useAnalysisStream();

  const initialBounds = useMemo(() => {
    const { width, height } = readViewport();
    return getDefaultPanelBounds(width, height);
  }, []);

  const [bounds, setBounds] = useState<PanelBounds>(initialBounds);
  /** 进入全屏前的普通态几何，退出全屏 / 从全屏最小化后还原用 */
  const [normalBounds, setNormalBounds] = useState<PanelBounds>(initialBounds);

  const tooSmall = isPanelTooSmall(bounds.width, bounds.height);

  const graphParsed = useMemo(
    () => (hasCompleted ? parseGraphJson(renderCode) : null),
    [hasCompleted, renderCode],
  );

  const handleAnalyze = useCallback(() => {
    if (!fileContent.trim()) {
      message.warning('当前文件无内容可分析');
      return;
    }
    void start({
      fileName: fileName || 'context.txt',
      fileContent,
    });
  }, [fileContent, fileName, start]);

  const handleClose = useCallback(() => {
    void abortAndCancel().finally(() => {
      onClose();
    });
  }, [abortAndCancel, onClose]);

  const handleMinimize = useCallback(() => {
    if (mode === 'fullscreen') {
      setBounds(normalBounds);
    } else {
      setNormalBounds(bounds);
    }
    onModeChange('minimized');
  }, [bounds, mode, normalBounds, onModeChange]);

  const handleRestore = useCallback(() => {
    setBounds(normalBounds);
    onModeChange('normal');
  }, [normalBounds, onModeChange]);

  const handleEnterFullscreen = useCallback(() => {
    setNormalBounds(bounds);
    onModeChange('fullscreen');
  }, [bounds, onModeChange]);

  const handleExitFullscreen = useCallback(() => {
    setBounds(normalBounds);
    onModeChange('normal');
  }, [normalBounds, onModeChange]);

  if (mode === 'minimized') {
    return (
      <button
        type="button"
        className={styles.chip}
        onClick={handleRestore}
        aria-label="还原分析工具"
      >
        分析工具
      </button>
    );
  }

  const hasMarkdown = Boolean(markdown);
  const subtitle = getResultSubtitle(status, hasMarkdown);
  const analyzeLabel = getAnalyzeButtonLabel(status, hasMarkdown);

  const toolbar = (
    <Space size="small" onMouseDown={(e) => e.stopPropagation()}>
      <Button
        size="small"
        icon={<MinusOutlined />}
        onClick={handleMinimize}
        aria-label="最小化"
      />
      {mode === 'fullscreen' ? (
        <Button size="small" onClick={handleExitFullscreen}>
          退出全屏
        </Button>
      ) : (
        <Button
          size="small"
          icon={<ExpandOutlined />}
          onClick={handleEnterFullscreen}
          aria-label="全屏"
        />
      )}
      <Button
        size="small"
        icon={<CloseOutlined />}
        onClick={handleClose}
        aria-label="关闭"
      />
    </Space>
  );

  let graphPane: ReactNode;
  if (status === 'running' || graphParsed === null) {
    graphPane = (
      <div className={styles.placeholder}>
        {status === 'running'
          ? '关系图谱将在分析完成后显示'
          : '关系图谱（占位）'}
      </div>
    );
  } else if (graphParsed.ok) {
    graphPane = (
      <RelationGraph
        graph={graphParsed.graph}
        knownPaths={knownPaths}
        onSelectFile={onSelectFile}
      />
    );
  } else if (graphParsed.reason === 'invalid') {
    graphPane = <div className={styles.placeholder}>异常渲染</div>;
  } else {
    graphPane = <div className={styles.placeholder}>无文件关联结果</div>;
  }

  const body = (
    <div className={styles.body}>
      <div className={`${styles.pane} ${styles.paneResult}`}>
        <div className={styles.resultHeader}>
          <div className={styles.resultBrand}>
            <span className={styles.resultIcon} aria-hidden>
              <ThunderboltOutlined />
            </span>
            <div className={styles.resultTitleBlock}>
              <h2 className={styles.resultTitle}>AI 分析结果</h2>
              <p className={styles.resultSubtitle}>{subtitle}</p>
            </div>
          </div>
          <div
            className={styles.resultActions}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Button
              size="small"
              type="primary"
              icon={status === 'running' ? <LoadingOutlined /> : undefined}
              onClick={handleAnalyze}
            >
              {analyzeLabel}
            </Button>
          </div>
        </div>
        {errorMessage ? (
          <div className={styles.errorBar}>{errorMessage}</div>
        ) : null}
        <div className={styles.resultCard}>
          {markdown ? (
            <MarkdownPreview source={markdown} className={styles.result} />
          ) : (
            <div className={styles.empty}>暂无结果</div>
          )}
        </div>
      </div>
      <div className={`${styles.pane} ${styles.paneGraph}`}>{graphPane}</div>
      {mode === 'normal' && tooSmall ? (
        <div className={styles.tooSmall}>
          尺寸过小，呈现效果不佳，请拉大弹窗
        </div>
      ) : null}
    </div>
  );

  if (mode === 'fullscreen') {
    return (
      <div className={`${styles.panel} ${styles.panelFullscreen}`}>
        <div className={`${styles.header} ${styles.headerFullscreen}`}>
          <span className={styles.title}>分析工具</span>
          {toolbar}
        </div>
        {body}
      </div>
    );
  }

  return (
    <Rnd
      className={styles.rnd}
      size={{ width: bounds.width, height: bounds.height }}
      position={{ x: bounds.x, y: bounds.y }}
      minWidth={280}
      minHeight={200}
      bounds="window"
      dragHandleClassName={styles.header}
      onDragStop={(_e, d) => {
        setBounds((prev) => {
          const next = { ...prev, x: d.x, y: d.y };
          setNormalBounds(next);
          return next;
        });
      }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        const next = {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          x: position.x,
          y: position.y,
        };
        setBounds(next);
        setNormalBounds(next);
      }}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>分析工具</span>
          {toolbar}
        </div>
        {body}
      </div>
    </Rnd>
  );
}

export default AnalysisPanel;
