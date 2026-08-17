import MarkdownPreview from '@/components/MarkdownPreview';
import { Empty, Segmented, Typography, message } from 'antd';
import type { DragEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { readDroppedTextFile } from '../../drop/readDroppedTextFile';
import styles from './index.less';
import type { PreviewMode, PreviewPaneProps } from './types';

export type { PreviewMode, PreviewPaneProps } from './types';

/**
 * 工作台右侧预览壳：顶栏 path + 模式切换；Markdown / 原文；支持拖入单文件
 */
function PreviewPane({ path, content, onDropFile }: PreviewPaneProps) {
  const [mode, setMode] = useState<PreviewMode>('markdown');
  const [dragging, setDragging] = useState(false);
  const dragDepthRef = useRef(0);

  const resetDrag = useCallback(() => {
    dragDepthRef.current = 0;
    setDragging(false);
  }, []);

  // Esc 取消拖拽不会触发 leave/drop，靠 document dragend 清遮罩
  useEffect(() => {
    if (!dragging) return;
    const onDragEnd = () => resetDrag();
    document.addEventListener('dragend', onDragEnd);
    return () => document.removeEventListener('dragend', onDragEnd);
  }, [dragging, resetDrag]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (![...e.dataTransfer.types].includes('Files')) return;
    dragDepthRef.current += 1;
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ([...e.dataTransfer.types].includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resetDrag();
      const list = Array.from(e.dataTransfer.files);
      const entry = e.dataTransfer.items?.[0]?.webkitGetAsEntry?.() ?? null;
      const isDirectory = entry?.isDirectory === true;
      const result = await readDroppedTextFile(list, { isDirectory });
      if (!result.ok) {
        if (result.code === 'empty') return;
        if (result.code === 'multiple') {
          message.warning('仅支持拖入单个文件');
          return;
        }
        if (result.code === 'directory') {
          message.warning('不支持拖入文件夹');
          return;
        }
        if (result.code === 'unsupported') {
          message.warning('不支持该文件类型');
          return;
        }
        message.error('读取文件失败');
        return;
      }
      onDropFile(result.file);
    },
    [onDropFile, resetDrag],
  );

  const dropHandlers = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };

  const overlay = dragging ? (
    <div className={styles.dropOverlay}>释放以预览</div>
  ) : null;

  if (!path || content === null) {
    return (
      <div className={styles.dropTarget} {...dropHandlers}>
        <Empty
          className={styles.empty}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <>
              从左侧选择文件
              <div className={styles.emptyHint}>或拖入单个文本文件预览</div>
            </>
          }
        />
        {overlay}
      </div>
    );
  }

  return (
    <div className={styles.dropTarget} {...dropHandlers}>
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
      {overlay}
    </div>
  );
}

export default PreviewPane;
