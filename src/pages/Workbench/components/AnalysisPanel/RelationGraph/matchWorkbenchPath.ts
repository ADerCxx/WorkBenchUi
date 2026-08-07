export function normalizePathKey(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

/** 在已知扫描路径中解析节点 path；失败返回 null */
export function matchWorkbenchPath(
  path: string | undefined,
  knownPaths: string[],
): string | null {
  if (!path) return null;
  const key = normalizePathKey(path);
  if (!key) return null;
  const normalizedKnown = knownPaths.map(normalizePathKey);
  const idx = normalizedKnown.indexOf(key);
  if (idx >= 0) return normalizePathKey(knownPaths[idx]!);
  return null;
}
