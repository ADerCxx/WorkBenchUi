import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useMemo, useState } from 'react';
import styles from './index.less';
import { matchWorkbenchPath } from './matchWorkbenchPath';
import { toFlowElements, type RelationNodeData } from './toFlowElements';
import type { GraphJson } from './types';

export type RelationGraphProps = {
  graph: GraphJson;
  knownPaths: string[];
  onSelectFile: (path: string) => void;
};

type RelationFlowNode = Node<RelationNodeData, 'relation'>;

function RelationNode({ data }: NodeProps<RelationFlowNode>) {
  return (
    <div
      className={
        data.active ? `${styles.node} ${styles.nodeActive}` : styles.node
      }
    >
      <Handle type="target" position={Position.Left} />
      <div className={styles.nodeLabel}>{data.label}</div>
      {data.summary ? (
        <div className={styles.nodeSummary}>{data.summary}</div>
      ) : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  relation: RelationNode,
};

function RelationGraph({
  graph,
  knownPaths,
  onSelectFile,
}: RelationGraphProps) {
  const { nodes: baseNodes, edges: baseEdges } = useMemo(
    () => toFlowElements(graph),
    [graph],
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const neighborIds = useMemo(() => {
    if (!activeId) return new Set<string>();
    const s = new Set<string>([activeId]);
    for (const e of baseEdges) {
      if (e.source === activeId) s.add(e.target);
      if (e.target === activeId) s.add(e.source);
    }
    return s;
  }, [activeId, baseEdges]);

  const nodes = useMemo(
    () =>
      baseNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          active: neighborIds.has(n.id),
        },
      })),
    [baseNodes, neighborIds],
  );

  const edges = useMemo(
    () =>
      baseEdges.map((e) => ({
        ...e,
        style:
          activeId && (e.source === activeId || e.target === activeId)
            ? { stroke: 'var(--accent)', strokeWidth: 2 }
            : undefined,
      })),
    [activeId, baseEdges],
  );

  const onNodeClick: NodeMouseHandler<RelationFlowNode> = useCallback(
    (_e, node) => {
      setActiveId(node.id);
      const matched = matchWorkbenchPath(node.data.path, knownPaths);
      if (matched) onSelectFile(matched);
    },
    [knownPaths, onSelectFile],
  );

  return (
    <div className={styles.root}>
      {graph.title ? <h3 className={styles.title}>{graph.title}</h3> : null}
      <div className={styles.canvas}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}

export default RelationGraph;
