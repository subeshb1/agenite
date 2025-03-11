import { createTsupConfig } from '@repo/tsup-config';

export default createTsupConfig({
  entry: {
    'deepseek-r1': './src/deepseek-r1/agent.ts',
    'claude-sonnet-3.7': './src/claude-sonnet-3.7/agent.ts',
  },
  format: ['esm'],
  bundle: true,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: true,
});
