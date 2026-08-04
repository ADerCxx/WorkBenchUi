import {
  isConventionRootName,
  isTargetMarkdown,
  shouldSkipDirName,
} from './pathMatch';
import type { RawFile } from './types';

async function readFileHandle(
  handle: FileSystemFileHandle,
  relativePath: string,
): Promise<RawFile | null> {
  try {
    const file = await handle.getFile();
    const content = await file.text();
    return { relativePath, content };
  } catch {
    return null;
  }
}

async function walkDir(
  dir: FileSystemDirectoryHandle,
  prefix: string,
  out: RawFile[],
): Promise<void> {
  for await (const [name, handle] of dir.entries()) {
    const rel = prefix ? `${prefix}/${name}` : name;

    if (handle.kind === 'directory') {
      if (shouldSkipDirName(name)) continue;
      await walkDir(handle, rel, out);
      continue;
    }
    if (handle.kind !== 'file') continue;
    if (!isTargetMarkdown(name)) continue;

    const raw = await readFileHandle(handle, rel);
    if (raw) out.push(raw);
  }
}

/**
 * 仅扫描项目根第一层约定目录内的 .md / .mdc。
 * 缺根静默跳过；不把「选中目录本身是约定根」当作主路径。
 */
export async function scanHardcodedRoots(
  projectRoot: FileSystemDirectoryHandle,
): Promise<RawFile[]> {
  const out: RawFile[] = [];

  for await (const [name, handle] of projectRoot.entries()) {
    if (handle.kind !== 'directory') continue;
    if (!isConventionRootName(name)) continue;
    await walkDir(handle, name, out);
  }

  return out;
}
