import { describe, expect, it } from 'vitest';
import { trimOrDefault } from '../example';

describe('trimOrDefault', () => {
  it('有非空字符串时应 trim 后返回', () => {
    expect(trimOrDefault('  hi  ', 'default')).toBe('hi');
  });

  it('空或空白时应返回 fallback', () => {
    expect(trimOrDefault(null, 'default')).toBe('default');
    expect(trimOrDefault('   ', 'default')).toBe('default');
  });
});
