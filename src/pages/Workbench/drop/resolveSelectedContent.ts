import type { DroppedFile } from './types';

/**
 * 当前预览/分析用文本：覆盖层优先，否则扫描 Map
 */
export function resolveSelectedContent(
  selectedPath: string | null,
  droppedFile: DroppedFile | null,
  contentByPath: Map<string, string>,
): string | null {
  if (selectedPath === null) return null;
  if (droppedFile !== null && selectedPath === droppedFile.path) {
    return droppedFile.content;
  }
  return contentByPath.get(selectedPath) ?? null;
}
