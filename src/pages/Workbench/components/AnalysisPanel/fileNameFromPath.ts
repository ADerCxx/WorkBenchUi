/** 从工作台选中 path 取文件名；空则默认 context.txt（对齐后端） */
export function fileNameFromPath(path: string | null | undefined): string {
  if (!path) {
    return 'context.txt';
  }
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'context.txt';
}
