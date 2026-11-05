import type { AppPath } from './paths';
import { PATHS } from './paths';

/**
 * 主站布局（MainLayout）的导航菜单数据。
 *
 * 与路由表放在 router 模块下维护，保证"菜单"与"路由"同源：
 * 新增页面时改这两个文件，不必去 MainLayout 里加 `<Link>`。
 *
 * 注意：本文件只依赖 paths.ts，**不得 import 布局或页面组件**，
 * 否则会与 routes.tsx 形成循环依赖。
 */
export interface MenuItem {
  to: AppPath;
  label: string;
}

export const mainMenu: MenuItem[] = [
  { to: PATHS.home, label: '首页' },
  { to: PATHS.workbench, label: '工作台' },
  { to: PATHS.regexSettings, label: '正则设置' },
];
