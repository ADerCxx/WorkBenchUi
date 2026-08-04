import type { RawFile } from './types';
import type { CompiledWhitelistRule } from './whitelistMatch';
import { matchesFileName, rulesForRootDir } from './whitelistMatch';

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

/** 已进入白名单根目录后：递归全部子目录，仅按文件名正则过滤 */
async function walkUnderRoot(
  dir: FileSystemDirectoryHandle,
  prefix: string,
  rules: CompiledWhitelistRule[],
  out: RawFile[],
): Promise<void> {
  for await (const [name, handle] of dir.entries()) {
    const rel = `${prefix}/${name}`;

    if (handle.kind === 'directory') {
      await walkUnderRoot(handle, rel, rules, out);
      continue;
    }
    if (handle.kind !== 'file') continue;
    if (!matchesFileName(name, rules)) continue;

    const raw = await readFileHandle(handle, rel);
    if (raw) out.push(raw);
  }
}

/**
 * 按启用白名单扫描：仅进入项目根下 folderName 命中的第一层目录。
 */
export async function scanByWhitelist(
  projectRoot: FileSystemDirectoryHandle,
  rules: CompiledWhitelistRule[],
): Promise<RawFile[]> {
  if (rules.length === 0) return [];

  const out: RawFile[] = [];

  for await (const [name, handle] of projectRoot.entries()) {
    if (handle.kind !== 'directory') continue;
    const matched = rulesForRootDir(name, rules);
    if (matched.length === 0) continue;
    await walkUnderRoot(handle, name, matched, out);
  }

  return out;
}
