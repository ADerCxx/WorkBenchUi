import { describe, expect, it } from 'vitest';
import { fileNameFromPath } from '../fileNameFromPath';

describe('fileNameFromPath', () => {
  it('应从 posix 路径取 basename', () => {
    expect(fileNameFromPath('docs/a/SKILL.md')).toBe('SKILL.md');
  });

  it('应规范化反斜杠', () => {
    expect(fileNameFromPath('docs\\a\\SKILL.md')).toBe('SKILL.md');
  });

  it('null 或空字符串应返回 context.txt', () => {
    expect(fileNameFromPath(null)).toBe('context.txt');
    expect(fileNameFromPath(undefined)).toBe('context.txt');
    expect(fileNameFromPath('')).toBe('context.txt');
  });

  it('仅含分隔符的路径应返回 context.txt', () => {
    expect(fileNameFromPath('/')).toBe('context.txt');
    expect(fileNameFromPath('\\\\')).toBe('context.txt');
  });
});
