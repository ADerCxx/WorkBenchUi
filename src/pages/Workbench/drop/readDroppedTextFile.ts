import { isAllowedPreviewExt } from './isAllowedPreviewExt';
import type { DropReadResult } from './types';

/** 可测的最小 File 面 */
export type ReadableDropFile = {
  name: string;
  text: () => Promise<string>;
};

export type ReadDroppedOptions = {
  /** 调用方用 webkitGetAsEntry().isDirectory 探测后传入 */
  isDirectory?: boolean;
};

/**
 * 从拖入的 File 列表解析单个白名单文本文件
 */
export async function readDroppedTextFile(
  files: readonly ReadableDropFile[],
  options: ReadDroppedOptions = {},
): Promise<DropReadResult> {
  if (options.isDirectory) {
    return { ok: false, code: 'directory' };
  }
  if (files.length === 0) {
    return { ok: false, code: 'empty' };
  }
  if (files.length > 1) {
    return { ok: false, code: 'multiple' };
  }
  const f = files[0];
  if (!isAllowedPreviewExt(f.name)) {
    return { ok: false, code: 'unsupported' };
  }
  try {
    const content = await f.text();
    return { ok: true, file: { path: f.name, content } };
  } catch {
    return { ok: false, code: 'read_failed' };
  }
}
