export type FrontmatterStripProps = {
  matter: Record<string, unknown>;
};

export const FEATURED_KEYS = [
  'name',
  'description',
  'globs',
  'alwaysApply',
  'disable-model-invocation',
] as const;

export type FeaturedKey = (typeof FEATURED_KEYS)[number];
