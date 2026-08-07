import type {
  GraphEdgeJson,
  GraphJson,
  GraphNodeJson,
  ParseGraphResult,
} from './types';

function asNonEmptyString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
}

export function parseGraphJson(
  raw: string | null | undefined,
): ParseGraphResult {
  if (raw == null || !String(raw).trim()) {
    return { ok: false, reason: 'empty' };
  }
  let data: unknown;
  try {
    data = JSON.parse(String(raw));
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  if (!data || typeof data !== 'object') {
    return { ok: false, reason: 'invalid' };
  }
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) {
    return { ok: false, reason: 'invalid' };
  }

  const nodes: GraphNodeJson[] = [];
  const seen = new Set<string>();
  for (const item of obj.nodes) {
    if (!item || typeof item !== 'object') continue;
    const n = item as Record<string, unknown>;
    const id = asNonEmptyString(n.id);
    const label = asNonEmptyString(n.label);
    if (!id || !label || seen.has(id)) continue;
    seen.add(id);
    const node: GraphNodeJson = { id, label };
    const path = asNonEmptyString(n.path);
    const summary = asNonEmptyString(n.summary);
    if (path) node.path = path;
    if (summary) node.summary = summary;
    nodes.push(node);
  }
  if (nodes.length === 0) {
    return { ok: false, reason: 'empty' };
  }

  const edges: GraphEdgeJson[] = [];
  const edgeIds = new Set<string>();
  for (const item of obj.edges) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    const id = asNonEmptyString(e.id);
    const source = asNonEmptyString(e.source);
    const target = asNonEmptyString(e.target);
    if (!id || !source || !target) continue;
    if (edgeIds.has(id)) continue;
    if (!seen.has(source) || !seen.has(target)) continue;
    edgeIds.add(id);
    const edge: GraphEdgeJson = { id, source, target };
    const label = asNonEmptyString(e.label);
    if (label) edge.label = label;
    edges.push(edge);
  }

  const version = asNonEmptyString(obj.version) ?? '1.0';
  const title = asNonEmptyString(obj.title) ?? undefined;
  const graph: GraphJson = { version, nodes, edges };
  if (title) graph.title = title;
  return { ok: true, graph };
}
