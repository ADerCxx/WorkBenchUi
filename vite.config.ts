import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 将普通 *.less 按 CSS Modules 处理；*.global.less 保持全局。
 * Vite 内置仅识别 *.module.less，通过追加 query 命中其 cssModuleRE。
 */
function lessAsCssModules(): Plugin {
  return {
    name: 'less-as-css-modules',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source.includes('\0') || source.includes('node_modules')) {
        return null;
      }
      if (!/\.less(?:$|\?)/.test(source)) {
        return null;
      }
      if (/\.module\.less(?:$|\?)/.test(source)) {
        return null;
      }
      if (/\.global\.less(?:$|\?)/.test(source)) {
        return null;
      }

      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true,
      });
      if (!resolved || resolved.external) {
        return resolved;
      }

      const [filepath, query = ''] = resolved.id.split('?');
      if (/\.global\.less$/.test(filepath)) {
        return resolved;
      }
      if (/\.module\.less$/.test(filepath)) {
        return resolved;
      }

      const nextQuery = query
        ? `${query}&module=.module.less`
        : 'module=.module.less';
      return `${filepath}?${nextQuery}`;
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [lessAsCssModules(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  server: {
    proxy: {
      // VITE_API_URL 为空时，相对路径接口转到后端（按域名前缀扩展）
      '/regexRules': {
        target: 'http://172.16.27.80:8889',
        changeOrigin: true,
      },
      '/report': {
        target: 'http://172.16.27.80:8889',
        changeOrigin: true,
      },
      '/qoderSessions': {
        target: 'http://172.16.27.80:8889',
        changeOrigin: true,
      },
    },
  },
});
