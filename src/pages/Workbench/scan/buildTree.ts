import type { RawFile, WorkbenchTreeNode } from './types';

export type BuildTreeResult = {
  treeData: WorkbenchTreeNode[];
  contentByPath: Map<string, string>;
};

/**
 * 将扫描结果转为 Antd Tree 数据，并建立 path → content 映射。
 */
export function buildTree(files: RawFile[]): BuildTreeResult {
  const contentByPath = new Map<string, string>();
  const rootChildren: WorkbenchTreeNode[] = [];
  const dirMap = new Map<string, WorkbenchTreeNode>();

  function ensureDir(dirPath: string, title: string): WorkbenchTreeNode {
    const existing = dirMap.get(dirPath);
    if (existing) return existing;

    const node: WorkbenchTreeNode = {
      key: dirPath,
      title,
      children: [],
    };
    dirMap.set(dirPath, node);

    const parentSlash = dirPath.lastIndexOf('/');
    if (parentSlash === -1) {
      rootChildren.push(node);
    } else {
      const parentPath = dirPath.slice(0, parentSlash);
      const parentTitle = parentPath.includes('/')
        ? parentPath.slice(parentPath.lastIndexOf('/') + 1)
        : parentPath;
      const parent = ensureDir(parentPath, parentTitle);
      parent.children = parent.children ?? [];
      parent.children.push(node);
    }
    return node;
  }

  for (const file of files) {
    const norm = file.relativePath.replace(/\\/g, '/');
    contentByPath.set(norm, file.content);

    const parts = norm.split('/');
    const fileName = parts[parts.length - 1]!;
    if (parts.length === 1) {
      rootChildren.push({
        key: norm,
        title: fileName,
        isLeaf: true,
      });
      continue;
    }

    const dirPath = parts.slice(0, -1).join('/');
    // ensure full chain
    let acc = '';
    for (let i = 0; i < parts.length - 1; i++) {
      acc = acc ? `${acc}/${parts[i]}` : parts[i]!;
      ensureDir(acc, parts[i]!);
    }
    const parent = dirMap.get(dirPath)!;
    parent.children = parent.children ?? [];
    parent.children.push({
      key: norm,
      title: fileName,
      isLeaf: true,
    });
  }

  return { treeData: rootChildren, contentByPath };
}
