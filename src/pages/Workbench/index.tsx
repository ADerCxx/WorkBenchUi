import { message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import CatalogTree from './components/CatalogTree';
import RawPreview from './components/RawPreview';
import WorkbenchHeader from './components/WorkbenchHeader';
import styles from './index.less';
import { buildTree } from './scan/buildTree';
import { pickProjectRoot } from './scan/pickProjectRoot';
import { scanHardcodedRoots } from './scan/scanHardcodedRoots';
import type { RawFile } from './scan/types';

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

/**
 * 工作台：选择项目根并展示约定目录下的 md/mdc 树与原文
 */
function Workbench() {
  const [loading, setLoading] = useState(false);
  const [hasPicked, setHasPicked] = useState(false);
  const [rootName, setRootName] = useState<string | null>(null);
  const [files, setFiles] = useState<RawFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const { treeData, contentByPath } = useMemo(() => buildTree(files), [files]);

  const selectedContent =
    selectedPath !== null ? (contentByPath.get(selectedPath) ?? null) : null;

  const handlePickFolder = useCallback(async () => {
    try {
      const handle = await pickProjectRoot();
      setLoading(true);
      const scanned = await scanHardcodedRoots(handle);
      setFiles(scanned);
      setRootName(handle.name);
      setHasPicked(true);
      setSelectedPath(null);
    } catch (err) {
      if (isAbortError(err)) return;
      const msg = err instanceof Error ? err.message : '扫描失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectFile = useCallback((path: string) => {
    setSelectedPath(path);
  }, []);

  return (
    <div className={styles.page}>
      <WorkbenchHeader
        rootName={rootName}
        loading={loading}
        onPickFolder={handlePickFolder}
      />
      <div className={styles.body}>
        <aside className={styles.catalog}>
          <CatalogTree
            hasPicked={hasPicked}
            loading={loading}
            treeData={treeData}
            selectedPath={selectedPath}
            onSelectFile={handleSelectFile}
          />
        </aside>
        <main className={styles.preview}>
          <RawPreview path={selectedPath} content={selectedContent} />
        </main>
      </div>
    </div>
  );
}

export default Workbench;
