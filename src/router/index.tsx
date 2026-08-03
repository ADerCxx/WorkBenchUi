import BlankLayout from '@/layouts/BlankLayout';
import MainLayout from '@/layouts/MainLayout';
import WorkbenchLayout from '@/layouts/WorkbenchLayout';
import BlankPlaceholder from '@/pages/BlankPlaceholder';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import RegexSettings from '@/pages/RegexSettings';
import Workbench from '@/pages/Workbench';
import { createBrowserRouter } from 'react-router-dom';

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

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'regex-settings', element: <RegexSettings /> },
        { path: '*', element: <NotFound /> },
      ],
    },
    {
      path: '/workbench',
      element: <WorkbenchLayout />,
      children: [{ index: true, element: <Workbench /> }],
    },
    {
      path: '/blank',
      element: <BlankLayout />,
      children: [{ index: true, element: <BlankPlaceholder /> }],
    },
  ],
  { basename: getBasename() },
);
