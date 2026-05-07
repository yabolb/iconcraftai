import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      // Rewrite .js imports to .ts for source files
      { find: /^(\.{1,2}\/.*?)\.js$/, replacement: '$1.ts' },
      { find: '@engine', replacement: path.resolve(__dirname, 'src/engine') },
      { find: '@schemas', replacement: path.resolve(__dirname, 'src/schemas') },
      { find: '@exporters', replacement: path.resolve(__dirname, 'src/exporters') },
      { find: '@mcp', replacement: path.resolve(__dirname, 'src/mcp') },
      { find: '@ui', replacement: path.resolve(__dirname, 'src/ui') },
      { find: '@payments', replacement: path.resolve(__dirname, 'src/payments') },
      { find: '@dashboard', replacement: path.resolve(__dirname, 'src/dashboard') },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/index.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
