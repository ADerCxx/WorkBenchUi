import 'highlight.js/styles/github-dark.css';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import FrontmatterStrip from './FrontmatterStrip';
import styles from './index.less';
import { parseFrontmatter } from './parseFrontmatter';
import type { MarkdownPreviewProps } from './types';

export type { MarkdownPreviewProps } from './types';

/**
 * 可复用 Markdown 文档预览（GFM + 轻量语法高亮；自动抽离 frontmatter）
 */
function MarkdownPreview({ source, className }: MarkdownPreviewProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(' ');
  const { matter, body } = parseFrontmatter(source);

  return (
    <div className={rootClassName}>
      {matter ? (
        <FrontmatterStrip
          key={JSON.stringify(matter)}
          matter={matter}
        />
      ) : null}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownPreview;
