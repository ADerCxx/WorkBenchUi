import { describe, expect, it } from 'vitest';
import { isAllowedPreviewExt } from '../isAllowedPreviewExt';

describe('isAllowedPreviewExt', () => {
  it('白名单扩展名应通过（含大小写）', () => {
    expect(isAllowedPreviewExt('a.md')).toBe(true);
    expect(isAllowedPreviewExt('Rule.MDC')).toBe(true);
    expect(isAllowedPreviewExt('x.TsX')).toBe(true);
    expect(isAllowedPreviewExt('config.JSON')).toBe(true);
  });

  it('无扩展名或不在白名单应拒绝', () => {
    expect(isAllowedPreviewExt('README')).toBe(false);
    expect(isAllowedPreviewExt('a.png')).toBe(false);
    expect(isAllowedPreviewExt('a.pdf')).toBe(false);
    expect(isAllowedPreviewExt('')).toBe(false);
  });

  it('只取最后一个扩展名', () => {
    expect(isAllowedPreviewExt('archive.tar.gz')).toBe(false);
    expect(isAllowedPreviewExt('foo.bar.md')).toBe(true);
  });

  it('以点开头的白名单文件应通过', () => {
    expect(isAllowedPreviewExt('.env')).toBe(true);
    expect(isAllowedPreviewExt('.md')).toBe(true);
    expect(isAllowedPreviewExt('.png')).toBe(false);
  });
});
