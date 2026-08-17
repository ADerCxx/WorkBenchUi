import { describe, expect, it } from 'vitest';
import { parseSseData } from '../parseSseData';

describe('parseSseData', () => {
  it('应将合法 JSON 解析为 SseResponse', () => {
    const raw = JSON.stringify({
      sessionId: 's1',
      content: 'hello',
      renderCode: 'graph',
      eventId: 'e1',
      status: 'RUNNING',
    });
    expect(parseSseData(raw)).toEqual({
      sessionId: 's1',
      content: 'hello',
      renderCode: 'graph',
      eventId: 'e1',
      status: 'RUNNING',
    });
  });

  it('应 trim 首尾空白后再解析', () => {
    const raw = `  ${JSON.stringify({ content: 'delta' })}  `;
    expect(parseSseData(raw)).toEqual({ content: 'delta' });
  });

  it('空字符串或纯空白应返回 null', () => {
    expect(parseSseData('')).toBeNull();
    expect(parseSseData('   ')).toBeNull();
  });

  it('非法 JSON 应返回 null', () => {
    expect(parseSseData('{not-json')).toBeNull();
  });
});
