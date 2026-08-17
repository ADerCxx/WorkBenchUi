import { describe, expect, it } from 'vitest';
import { matchWorkbenchPath, normalizePathKey } from '../matchWorkbenchPath';

describe('normalizePathKey', () => {
  it('应将反斜杠转为正斜杠并去掉 ./ 前缀', () => {
    expect(normalizePathKey('.\\docs\\a.md')).toBe('docs/a.md');
    expect(normalizePathKey('./docs/a.md')).toBe('docs/a.md');
  });

  it('应 trim 首尾空白', () => {
    expect(normalizePathKey('  docs/a.md  ')).toBe('docs/a.md');
  });
});

describe('matchWorkbenchPath', () => {
  const known = ['docs/a.md', 'src/foo/SKILL.md'];

  it('应精确匹配已知路径', () => {
    expect(matchWorkbenchPath('docs/a.md', known)).toBe('docs/a.md');
  });

  it('应规范化反斜杠与 ./ 后匹配', () => {
    expect(matchWorkbenchPath('.\\docs\\a.md', known)).toBe('docs/a.md');
  });

  it('未命中时应返回 null', () => {
    expect(matchWorkbenchPath('docs/missing.md', known)).toBeNull();
  });

  it('path 为空或 undefined 时应返回 null', () => {
    expect(matchWorkbenchPath(undefined, known)).toBeNull();
    expect(matchWorkbenchPath('', known)).toBeNull();
    expect(matchWorkbenchPath('   ', known)).toBeNull();
  });

  it('命中后应返回规范化后的 known 路径', () => {
    const mixedKnown = ['docs\\b.md'];
    expect(matchWorkbenchPath('docs/b.md', mixedKnown)).toBe('docs/b.md');
  });
});
