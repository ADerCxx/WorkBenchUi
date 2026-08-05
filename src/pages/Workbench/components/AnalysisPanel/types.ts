export type AnalysisPanelMode = 'normal' | 'minimized' | 'fullscreen';

export type AnalysisPanelProps = {
  mode: AnalysisPanelMode;
  onModeChange: (mode: AnalysisPanelMode) => void;
  onClose: () => void;
};
