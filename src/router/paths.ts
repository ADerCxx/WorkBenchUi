/**
 * 全站路由路径常量。
 *
 * 组件里禁止硬编码路由字面量（如 `<Link to="/workbench" />`），
 * 一律引用本文件的字段，避免改路径时全局搜索。
 */
export const PATHS = {
  /** 首页（主站布局） */
  home: '/',
  /** 正则设置 */
  regexSettings: '/regex-settings',
  /** 工作台（空白布局） */
  workbench: '/workbench',
  /** 空白占位页 */
  blank: '/blank',
} as const;

/** 单个路径取值的联合类型 */
export type AppPath = (typeof PATHS)[keyof typeof PATHS];
