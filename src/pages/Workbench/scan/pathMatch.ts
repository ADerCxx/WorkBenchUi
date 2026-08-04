import {
  CONVENTION_ROOTS,
  SKIP_DIR_NAMES,
  TARGET_EXTENSIONS,
} from './constants';

const ROOT_SET = new Set(CONVENTION_ROOTS.map((n) => n.toLowerCase()));

export function isConventionRootName(name: string): boolean {
  return ROOT_SET.has(name.toLowerCase());
}

export function shouldSkipDirName(name: string): boolean {
  const lower = name.toLowerCase();
  return SKIP_DIR_NAMES.some((s) => s.toLowerCase() === lower);
}

export function isTargetMarkdown(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return TARGET_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
