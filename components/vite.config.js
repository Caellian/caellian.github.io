import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { transform } from 'esbuild';
import pkg from './package.json';

const bundleComponents = process.env.BUNDLE_COMPONENTS ?? true;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      exclude: /\.wc\.svelte$/,
      compilerOptions: {
        customElement: false
      }
    }),
    svelte({
      include: /\.wc\.svelte$/,
    }),
    minifyEs()
  ],
  build: {
    sourcemap: true,
    target: "modules",
    outDir: "../src/web_components/",
    emptyOutDir: true,
    lib: {
      entry: './index.js',
      formats: ['es'],
      name: pkg.name.replace(/-./g, (char) => char[1].toUpperCase()),
      fileName: "index"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        chunkFileNames: "[name].js",
        manualChunks: { 'svelte': ["svelte"] }
      }
    }
  }
})

// Workaround for https://github.com/vitejs/vite/issues/6555
function minifyEs() {
  return {
    name: 'minifyEs',
    renderChunk: {
      order: 'post',
      async handler(code) {
        return await transform(code, { minify: true, sourcemap: true });
      },
    }
  };
}