import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:41739'
  },
  webServer: [
    {
      command: 'node e2e/api.cjs',
      url: 'http://127.0.0.1:3002/templates',
      reuseExistingServer: false
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 41739 --strictPort',
      url: 'http://127.0.0.1:41739',
      env: { VITE_API_URL: 'http://127.0.0.1:3002' },
      reuseExistingServer: false
    }
  ]
})
