import type { WorkbenchTreeNode } from '../../scan/types';

export type CatalogTreeProps = {
  hasPicked: boolean;
  loading: boolean;
  treeData: WorkbenchTreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
};
