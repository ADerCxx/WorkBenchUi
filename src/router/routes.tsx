import BlankLayout from '@/layouts/BlankLayout';
import MainLayout from '@/layouts/MainLayout';
import NotFound from '@/pages/NotFound';
import RouteError from '@/pages/RouteError';
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import MetaSync from './MetaSync';
import { PATHS, type AppPath } from './paths';
import type { RouteMeta } from './types';

/**
 * 绝对路径 → 子路由相对路径段（`children` 里不接受前导斜杠）。
 * 这样 `children` 的路径仍以 PATHS 为唯一来源，不写第二份字面量。
 */
function childPath(absolute: AppPath): string {
  return absolute.replace(/^\//, '');
}

// 页面级一律懒加载：按页分包，首屏只下载当前路由所需代码。
// Suspense 边界由 MetaSync 与各 Layout 提供，此处**不再**逐个 element 包裹。
const Home = lazy(() => import('@/pages/Home'));
const RegexSettings = lazy(() => import('@/pages/RegexSettings'));
const Workbench = lazy(() => import('@/pages/Workbench'));
const BlankPlaceholder = lazy(() => import('@/pages/BlankPlaceholder'));

/**
 * 路由表。
 *
 * 三条硬规则（改这个文件时必须遵守）：
 * 1. **每个顶层区域都要有自己的 `* `兜底** —— 否则该区域的未知路径会
 *    跳到别的区域去匹配，出现"在工作台里却渲染主站导航"的错乱；
 * 2. **每个持有 element 的路由都要配 errorElement** —— 缺了就冒泡到框架
 *    默认错误页（生产表现为白屏）；
 * 3. **页面组件必须 lazy** —— 直接静态 import 会把所有页面打进首屏。
 */
const routes: RouteObject[] = [
  {
    // 无 path 的根布局：不放 UI，只做最外层兜底与 title 同步
    element: <MetaSync />,
    errorElement: <RouteError />,
    children: [
      {
        path: PATHS.home,
        element: <MainLayout />,
        errorElement: <RouteError />,
        handle: { title: '首页' } satisfies RouteMeta,
        children: [
          {
            index: true,
            element: <Home />,
            handle: { title: '首页' } satisfies RouteMeta,
          },
          {
            path: childPath(PATHS.regexSettings),
            element: <RegexSettings />,
            handle: { title: '正则设置' } satisfies RouteMeta,
          },
          // 本区域兜底：让 /nope 停留在主站布局内
          {
            path: '*',
            element: <NotFound />,
            handle: { title: '页面不存在' } satisfies RouteMeta,
          },
        ],
      },
      {
        path: PATHS.workbench,
        element: <BlankLayout />,
        errorElement: <RouteError />,
        handle: { title: '工作台' } satisfies RouteMeta,
        children: [
          {
            index: true,
            element: <Workbench />,
            handle: { title: '工作台' } satisfies RouteMeta,
          },
          // 本区域兜底：让 /workbench/xxx 停留在工作台布局内
          {
            path: '*',
            element: <NotFound />,
            handle: { title: '页面不存在' } satisfies RouteMeta,
          },
        ],
      },
      {
        path: PATHS.blank,
        element: <BlankLayout />,
        errorElement: <RouteError />,
        handle: { title: '占位页' } satisfies RouteMeta,
        children: [
          {
            index: true,
            element: <BlankPlaceholder />,
            handle: { title: '占位页' } satisfies RouteMeta,
          },
          {
            path: '*',
            element: <NotFound />,
            handle: { title: '页面不存在' } satisfies RouteMeta,
          },
        ],
      },
      // 根级最终兜底（理论上不可达，留作安全网）
      {
        path: '*',
        element: <NotFound />,
        handle: { title: '页面不存在' } satisfies RouteMeta,
      },
    ],
  },
];

export default routes;
