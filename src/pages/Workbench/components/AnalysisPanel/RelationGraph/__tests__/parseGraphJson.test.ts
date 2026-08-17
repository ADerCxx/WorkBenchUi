import { describe, expect, it } from 'vitest';
import { parseGraphJson } from '../parseGraphJson';

describe('parseGraphJson', () => {
  it('应解析合法图 JSON', () => {
    const raw = JSON.stringify({
      version: '1.0',
      title: '依赖',
      nodes: [
        { id: 'a', label: 'A', path: 'docs/a.md', summary: '说明' },
        { id: 'b', label: 'B' },
      ],
      edges: [{ id: 'e1', source: 'a', target: 'b', label: '引用' }],
    });
    const result = parseGraphJson(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.graph.nodes).toHaveLength(2);
    expect(result.graph.edges).toHaveLength(1);
    expect(result.graph.title).toBe('依赖');
    expect(result.graph.nodes[0]).toEqual({
      id: 'a',
      label: 'A',
      path: 'docs/a.md',
      summary: '说明',
    });
  });

  it('blank renderCode 应返回 empty', () => {
    expect(parseGraphJson(null)).toEqual({ ok: false, reason: 'empty' });
    expect(parseGraphJson(undefined)).toEqual({ ok: false, reason: 'empty' });
    expect(parseGraphJson('')).toEqual({ ok: false, reason: 'empty' });
    expect(parseGraphJson('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('非法 JSON 应返回 invalid', () => {
    expect(parseGraphJson('{not-json')).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('缺少 nodes 或 edges 数组应返回 invalid', () => {
    expect(parseGraphJson(JSON.stringify({ version: '1.0' }))).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('应丢弃端点缺失的边并保留自环边', () => {
    const raw = JSON.stringify({
      version: '1.0',
      nodes: [{ id: 'a', label: 'A' }],
      edges: [
        { id: 'e1', source: 'a', target: 'missing' },
        { id: 'e2', source: 'a', target: 'a' },
      ],
    });
    const result = parseGraphJson(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.graph.edges.map((e) => e.id)).toEqual(['e2']);
  });

  it('无有效节点时应返回 empty', () => {
    expect(
      parseGraphJson(JSON.stringify({ version: '1.0', nodes: [], edges: [] })),
    ).toEqual({ ok: false, reason: 'empty' });
  });

  it('应跳过重复 id 的节点与边', () => {
    const raw = JSON.stringify({
      version: '1.0',
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'a', label: 'Duplicate' },
        { id: 'b', label: 'B' },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e1', source: 'a', target: 'b', label: 'dup' },
      ],
    });
    const result = parseGraphJson(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.graph.nodes.map((n) => n.id)).toEqual(['a', 'b']);
    expect(result.graph.edges).toHaveLength(1);
  });

  it('无 version 时应默认为 1.0', () => {
    const raw = JSON.stringify({
      nodes: [{ id: 'a', label: 'A' }],
      edges: [],
    });
    const result = parseGraphJson(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.graph.version).toBe('1.0');
  });
});
