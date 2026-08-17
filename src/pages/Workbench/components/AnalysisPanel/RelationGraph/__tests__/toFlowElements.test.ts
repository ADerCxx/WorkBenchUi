import { describe, expect, it } from 'vitest';
import { toFlowElements } from '../toFlowElements';
import type { GraphJson } from '../types';

const sampleGraph: GraphJson = {
  version: '1.0',
  title: '依赖',
  nodes: [
    { id: 'a', label: 'Node A', path: 'docs/a.md', summary: '说明 A' },
    { id: 'b', label: 'Node B' },
  ],
  edges: [{ id: 'e1', source: 'a', target: 'b', label: '引用' }],
};

describe('toFlowElements', () => {
  it('应映射节点与边的数量', () => {
    const { nodes, edges } = toFlowElements(sampleGraph);
    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);
  });

  it('节点应带 relation 类型与业务 data', () => {
    const { nodes } = toFlowElements(sampleGraph);
    const nodeA = nodes.find((n) => n.id === 'a');
    expect(nodeA?.type).toBe('relation');
    expect(nodeA?.data).toEqual({
      label: 'Node A',
      path: 'docs/a.md',
      summary: '说明 A',
    });
    expect(nodeA?.style).toEqual({ width: 180 });
  });

  it('无 summary/path 的节点 data 应只含 label', () => {
    const { nodes } = toFlowElements(sampleGraph);
    const nodeB = nodes.find((n) => n.id === 'b');
    expect(nodeB?.data).toEqual({ label: 'Node B' });
  });

  it('边应保留 id、source、target 与 label', () => {
    const { edges } = toFlowElements(sampleGraph);
    expect(edges[0]).toEqual({
      id: 'e1',
      source: 'a',
      target: 'b',
      label: '引用',
    });
  });

  it('节点 position 应为有限数值（dagre 布局结果）', () => {
    const { nodes } = toFlowElements(sampleGraph);
    for (const node of nodes) {
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
    }
  });

  it('相同输入应产生相同布局坐标', () => {
    const first = toFlowElements(sampleGraph);
    const second = toFlowElements(sampleGraph);
    expect(first.nodes.map((n) => n.position)).toEqual(
      second.nodes.map((n) => n.position),
    );
  });
});
