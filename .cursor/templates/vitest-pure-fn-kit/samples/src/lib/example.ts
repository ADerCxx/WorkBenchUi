/** 示例纯函数：安装 vitest-pure-fn-kit 后可选复制 */
export function trimOrDefault(
  value: string | null | undefined,
  fallback: string,
): string {
  const t = value?.trim();
  return t ? t : fallback;
}
