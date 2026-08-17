const ALLOWED = new Set([
  'md',
  'mdc',
  'markdown',
  'txt',
  'ts',
  'tsx',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'json',
  'css',
  'less',
  'scss',
  'html',
  'htm',
  'xml',
  'yml',
  'yaml',
  'toml',
  'ini',
  'env',
  'sh',
  'bat',
  'ps1',
  'java',
  'py',
  'go',
  'rs',
  'sql',
  'svg',
]);

/**
 * 按文件名最后一个扩展名判定是否允许预览（大小写不敏感）
 */
export function isAllowedPreviewExt(fileName: string): boolean {
  const base = fileName.trim();
  if (!base) return false;
  const dot = base.lastIndexOf('.');
  // 允许 `.env` 等「以点开头」的文件名（dot === 0）；无点或尾点仍拒绝
  if (dot < 0 || dot === base.length - 1) return false;
  const ext = base.slice(dot + 1).toLowerCase();
  return ALLOWED.has(ext);
}
