import type { DroppedFile } from '../../drop/types';

export type PreviewMode = 'markdown' | 'raw';

export type PreviewPaneProps = {
  path: string | null;
  content: string | null;
  /** 拖入校验通过后的文件；由父组件写入覆盖层 */
  onDropFile: (file: DroppedFile) => void;
};
