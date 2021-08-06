import tsconfigPaths from 'vite-tsconfig-paths';
import solid from 'vite-plugin-solid';
// Import viteTips from 'vite-plugin-tips';
import {defineConfig} from 'vite';
import windi_pkg from 'vite-plugin-windicss';
type Windi = typeof windi_pkg;
const windiCSS = (windi_pkg as Windi & {default: Windi}).default;

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
    windiCSS({
      scan: {
        // We only have to specify the file extensions we actually use.
        fileExtensions: ['tsx', 'html']
      }
    })
  ]
});
