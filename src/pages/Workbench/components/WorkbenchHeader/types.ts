export type WorkbenchHeaderProps = {
  rootName: string | null;
  loading: boolean;
  onPickFolder: () => void;
  /** 无选中文件时为 true，禁用「分析工具」 */
  analysisDisabled: boolean;
  onOpenAnalysis: () => void;
};
