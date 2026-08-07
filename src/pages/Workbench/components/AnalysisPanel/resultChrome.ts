import type { AnalysisStreamStatus } from '@/hooks/useAnalysisStream';

export function getResultSubtitle(
  status: AnalysisStreamStatus,
  hasMarkdown: boolean,
): string {
  if (status === 'running') {
    return '正在根据当前文件生成解读与建议…';
  }
  if (status === 'error') {
    return '分析中断或失败，可修改后重新分析';
  }
  if (hasMarkdown) {
    return '已根据当前文件内容生成本次解读与建议。';
  }
  return '点击一键分析，查看 AI 结果';
}

export function getAnalyzeButtonLabel(
  status: AnalysisStreamStatus,
  hasMarkdown: boolean,
): string {
  if (status === 'running' || hasMarkdown) {
    return '重新分析';
  }
  return '一键分析';
}
