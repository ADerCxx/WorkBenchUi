export type RawFile = {
  relativePath: string;
  content: string;
};

export type WorkbenchTreeNode = {
  key: string;
  title: string;
  isLeaf?: boolean;
  children?: WorkbenchTreeNode[];
};
