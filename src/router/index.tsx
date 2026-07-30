import App from '@/App';
import Demo from '@/pages/Demo';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
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
      element: <App />,
      children: [
        { index: true, element: <Home /> },
        { path: 'demo', element: <Demo /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: getBasename() },
);
