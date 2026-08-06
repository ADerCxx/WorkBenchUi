import 'highlight.js/styles/github-dark.css';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import styles from './index.less';
import type { MarkdownPreviewProps } from './types';

export type { MarkdownPreviewProps } from './types';

/**
 * 可复用 Markdown 文档预览（GFM + 轻量语法高亮）
 */
function MarkdownPreview({ source, className }: MarkdownPreviewProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownPreview;
