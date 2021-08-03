import tsconfigPaths from 'vite-tsconfig-paths';
import solid from 'vite-plugin-solid';
import windiCSS from 'vite-plugin-windicss';
// Import viteTips from 'vite-plugin-tips';
import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    polyfillDynamicImport: false,
    sourcemap: true
  },
  plugins: [
    // ViteTips(),
    tsconfigPaths(),
    solid(),
    windiCSS([
      {
        scan: {
          // We only have to specify the file extensions we actually use.
          fileExtensions: ['tsx', 'html']
        }
      }
    ])
  ]
});
