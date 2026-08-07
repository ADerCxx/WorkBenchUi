export type AnalysisPanelMode = 'normal' | 'minimized' | 'fullscreen';

export type AnalysisPanelProps = {
  mode: AnalysisPanelMode;
  onModeChange: (mode: AnalysisPanelMode) => void;
  onClose: () => void;
  /** 当前选中文件名（basename）；可为空串，分析前由面板校验内容 */
  fileName: string;
  /** 当前选中文件全文；空则不可发起分析 */
  fileContent: string;
  /** 工作台已扫描文件相对路径（统一 /） */
  knownPaths: string[];
  /** 点击图谱节点匹配到路径时选中该文件 */
  onSelectFile: (path: string) => void;
};
