import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 打包后走 file:// 协议加载，必须用相对路径
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome128',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
