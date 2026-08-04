export function isDirectoryPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * 弹出目录选择器。约定：用户选择项目根。
 * 用户取消时抛出 DOMException AbortError（由调用方静默处理）。
 */
export async function pickProjectRoot(): Promise<FileSystemDirectoryHandle> {
  if (!isDirectoryPickerSupported()) {
    throw new Error('当前浏览器不支持选择文件夹，请使用 Chrome 或 Edge');
  }
  return window.showDirectoryPicker({ mode: 'read' });
}
