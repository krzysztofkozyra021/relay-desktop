import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/lib/electron-app/extensions/**',
        'src/lib/electron-app/release/**',
        'src/resources/**',
        'src/renderer/index.tsx',
        'src/renderer/routes.tsx',
        'src/main/index.ts',
        'src/preload/index.ts',
      ],
    },
  },
})
