import {
  CloseOutlined,
  ExpandOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { Button, Space, message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { Rnd } from 'react-rnd';
import styles from './index.less';
import {
  getDefaultPanelBounds,
  isPanelTooSmall,
  type PanelBounds,
} from './panelGeometry';
import type { AnalysisPanelProps } from './types';

export type { AnalysisPanelMode, AnalysisPanelProps } from './types';

function readViewport(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 720 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * 分析工具浮窗壳：拖拽缩放、最小/全屏/关、左右占位；一键分析仅占位提示
 */
function AnalysisPanel({ mode, onModeChange, onClose }: AnalysisPanelProps) {
  const initialBounds = useMemo(() => {
    const { width, height } = readViewport();
    return getDefaultPanelBounds(width, height);
  }, []);

  const [bounds, setBounds] = useState<PanelBounds>(initialBounds);
  /** 进入全屏前的普通态几何，退出全屏 / 从全屏最小化后还原用 */
  const [normalBounds, setNormalBounds] = useState<PanelBounds>(initialBounds);

  const tooSmall = isPanelTooSmall(bounds.width, bounds.height);

  const handleAnalyze = useCallback(() => {
    message.info('分析能力即将接入');
  }, []);

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

  const toolbar = (
    <Space size="small" onMouseDown={(e) => e.stopPropagation()}>
      <Button size="small" type="primary" onClick={handleAnalyze}>
        一键分析
      </Button>
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
        onClick={onClose}
        aria-label="关闭"
      />
    </Space>
  );

  const body = (
    <div className={styles.body}>
      <div className={styles.pane}>
        <div className={styles.placeholder}>AI 分析结果（占位）</div>
      </div>
      <div className={styles.pane}>
        <div className={styles.placeholder}>关系图谱（占位）</div>
      </div>
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
      className={styles.panel}
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
      <div className={styles.header}>
        <span className={styles.title}>分析工具</span>
        {toolbar}
      </div>
      {body}
    </Rnd>
  );
}

export default AnalysisPanel;
