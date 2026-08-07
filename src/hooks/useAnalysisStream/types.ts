export type AnalysisStreamStatus = 'idle' | 'running' | 'error';

export type UseAnalysisStreamResult = {
  status: AnalysisStreamStatus;
  markdown: string;
  sessionId: string | null;
  errorMessage: string | null;
  renderCode: string | null;
  hasCompleted: boolean;
  start: (input: { fileName: string; fileContent: string }) => Promise<void>;
  abortAndCancel: () => Promise<void>;
};
