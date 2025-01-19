import { defineConfig } from 'tsup';
/**
 *
 * @param {*} options
 * @returns
 */
export function createTsupConfig(options = undefined) {
  return defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false,
    treeshake: true,
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.js' : '.mjs',
      };
    },
    ...options,
  });
}
