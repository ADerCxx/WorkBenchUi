import { RegexRulesQueryEnabledApi } from '@/apis/regexRules/queryEnabled';
import { message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import CatalogTree from './components/CatalogTree';
import RawPreview from './components/RawPreview';
import WorkbenchHeader from './components/WorkbenchHeader';
import styles from './index.less';
import { buildTree } from './scan/buildTree';
import { pickProjectRoot } from './scan/pickProjectRoot';
import { scanByWhitelist } from './scan/scanByWhitelist';
import type { RawFile } from './scan/types';
import { compileWhitelistRules } from './scan/whitelistMatch';

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

/**
 * 工作台：选择项目根，按启用白名单规则扫描并展示树与原文
 */
function Workbench() {
  const [loading, setLoading] = useState(false);
  const [hasPicked, setHasPicked] = useState(false);
  const [rootName, setRootName] = useState<string | null>(null);
  const [files, setFiles] = useState<RawFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [emptyDescription, setEmptyDescription] =
    useState('未扫描到匹配的白名单文件');

  const { treeData, contentByPath } = useMemo(() => buildTree(files), [files]);

  const selectedContent =
    selectedPath !== null ? (contentByPath.get(selectedPath) ?? null) : null;

  const handlePickFolder = useCallback(async () => {
    try {
      const handle = await pickProjectRoot();
      setLoading(true);
      const enabled = await RegexRulesQueryEnabledApi();
      const { rules, skipped } = compileWhitelistRules(enabled);
      if (skipped.length > 0) {
        message.warning(`已跳过 ${skipped.length} 条无效规则`);
      }
      if (rules.length === 0) {
        setFiles([]);
        setRootName(handle.name);
        setHasPicked(true);
        setSelectedPath(null);
        setEmptyDescription('无启用白名单规则');
        message.info('无可用白名单规则');
        return;
      }
      const scanned = await scanByWhitelist(handle, rules);
      setFiles(scanned);
      setRootName(handle.name);
      setHasPicked(true);
      setSelectedPath(null);
      setEmptyDescription('未扫描到匹配的白名单文件');
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
            emptyDescription={emptyDescription}
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
