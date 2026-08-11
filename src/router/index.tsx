import FabricLoading from '@/components/FabricLoading';
import BlankLayout from '@/layouts/BlankLayout';
import MainLayout from '@/layouts/MainLayout';
import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import styles from './index.less';

const Home = lazy(() => import('@/pages/Home'));
const RegexSettings = lazy(() => import('@/pages/RegexSettings'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Workbench = lazy(() => import('@/pages/Workbench'));
const BlankPlaceholder = lazy(() => import('@/pages/BlankPlaceholder'));

/**
 * 将 Vite BASE_URL 转为 react-router basename（无尾部斜杠；根路径不传）
 */
function getBasename(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') {
    return undefined;
  }
  return base.replace(/\/$/, '');
}

function suspense(page: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className={styles.fallback}>
          <FabricLoading size="md" />
        </div>
      }
    >
      {page}
    </Suspense>
  );
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { index: true, element: suspense(<Home />) },
        { path: 'regex-settings', element: suspense(<RegexSettings />) },
        { path: '*', element: suspense(<NotFound />) },
      ],
    },
    {
      path: '/workbench',
      element: <BlankLayout />,
      children: [{ index: true, element: suspense(<Workbench />) }],
    },
    {
      path: '/blank',
      element: <BlankLayout />,
      children: [{ index: true, element: suspense(<BlankPlaceholder />) }],
    },
  ],
  { basename: getBasename() },
);
