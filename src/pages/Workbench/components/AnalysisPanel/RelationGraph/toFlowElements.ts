import type { Edge, Node } from '@xyflow/react';
import dagre from 'dagre';
import type { GraphJson } from './types';

export type RelationNodeData = {
  label: string;
  summary?: string;
  path?: string;
  /** 由 RelationGraph 映射时写入，供自定义节点高亮 */
  active?: boolean;
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;

export function toFlowElements(graph: GraphJson): {
  nodes: Node<RelationNodeData, 'relation'>[];
  edges: Edge[];
} {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 60 });

  for (const n of graph.nodes) {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const e of graph.edges) {
    g.setEdge(e.source, e.target);
  }
  dagre.layout(g);

  const nodes: Node<RelationNodeData, 'relation'>[] = graph.nodes.map((n) => {
    const pos = g.node(n.id);
    const data: RelationNodeData = { label: n.label };
    if (n.summary) data.summary = n.summary;
    if (n.path) data.path = n.path;
    return {
      id: n.id,
      type: 'relation' as const,
      position: {
        x: (pos?.x ?? 0) - NODE_WIDTH / 2,
        y: (pos?.y ?? 0) - NODE_HEIGHT / 2,
      },
      data,
      style: { width: NODE_WIDTH },
    };
  });

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
  }));

  return { nodes, edges };
}
