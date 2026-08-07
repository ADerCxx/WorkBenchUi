export type GraphNodeJson = {
  id: string;
  label: string;
  path?: string;
  summary?: string;
};

export type GraphEdgeJson = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type GraphJson = {
  version: string;
  title?: string;
  nodes: GraphNodeJson[];
  edges: GraphEdgeJson[];
};

export type ParseGraphResult =
  { ok: true; graph: GraphJson } | { ok: false; reason: 'empty' | 'invalid' };
