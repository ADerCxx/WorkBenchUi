import type { WorkbenchTreeNode } from '../../scan/types';

export type CatalogTreeProps = {
  hasPicked: boolean;
  loading: boolean;
  treeData: WorkbenchTreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  /** 零命中时的空态文案 */
  emptyDescription?: string;
};
