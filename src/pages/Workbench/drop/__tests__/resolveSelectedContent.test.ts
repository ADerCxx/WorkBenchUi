import { describe, expect, it } from 'vitest';
import { resolveSelectedContent } from '../resolveSelectedContent';
import type { DroppedFile } from '../types';

describe('resolveSelectedContent', () => {
  const scanned = new Map<string, string>([['docs/a.md', 'from-scan']]);

  it('无选中返回 null', () => {
    expect(resolveSelectedContent(null, null, scanned)).toBeNull();
  });

  it('覆盖层 path 匹配时优先覆盖层', () => {
    const dropped: DroppedFile = { path: 'a.md', content: 'dropped' };
    expect(resolveSelectedContent('a.md', dropped, scanned)).toBe('dropped');
  });

  it('覆盖层 path 不匹配时回退扫描 Map', () => {
    const dropped: DroppedFile = { path: 'a.md', content: 'dropped' };
    expect(resolveSelectedContent('docs/a.md', dropped, scanned)).toBe(
      'from-scan',
    );
  });

  it('无覆盖层时从 Map 取值，缺失为 null', () => {
    expect(resolveSelectedContent('docs/a.md', null, scanned)).toBe(
      'from-scan',
    );
    expect(resolveSelectedContent('missing.md', null, scanned)).toBeNull();
  });
});
