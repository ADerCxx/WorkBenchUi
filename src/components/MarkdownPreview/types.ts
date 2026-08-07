export type MarkdownPreviewProps = {
  source: string;
  className?: string;
};

export type ParseFrontmatterResult = {
  /** 解析成功的 frontmatter 对象；失败或无则 null */
  matter: Record<string, unknown> | null;
  /** 供 Markdown 渲染的正文；失败/无时等于原始 source */
  body: string;
};
