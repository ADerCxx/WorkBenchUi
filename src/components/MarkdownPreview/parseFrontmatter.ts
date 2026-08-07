import { load as loadYaml } from 'js-yaml';
import type { ParseFrontmatterResult } from './types';

const OPENING = /^---[ \t]*\r?\n/;

function stripBom(source: string): string {
  return source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

/**
 * 抽离文件头 YAML frontmatter。失败或不存在时 matter 为 null，body 为原始 source。
 */
export function parseFrontmatter(source: string): ParseFrontmatterResult {
  const withoutBom = stripBom(source);
  const leadMatch = withoutBom.match(/^[\t \r\n]*/);
  const lead = leadMatch?.[0] ?? '';
  const afterLead = withoutBom.slice(lead.length);

  if (!OPENING.test(afterLead)) {
    return { matter: null, body: source };
  }

  const afterOpen = afterLead.replace(OPENING, '');
  const closeMatch = afterOpen.match(/\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!closeMatch || closeMatch.index === undefined) {
    return { matter: null, body: source };
  }

  const yamlText = afterOpen.slice(0, closeMatch.index);
  const body = afterOpen.slice(closeMatch.index + closeMatch[0].length);

  try {
    const parsed = loadYaml(yamlText);
    if (!isPlainObject(parsed)) {
      return { matter: null, body: source };
    }
    return { matter: parsed, body };
  } catch {
    return { matter: null, body: source };
  }
}
