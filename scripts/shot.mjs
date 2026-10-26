/**
 * 开发辅助：无头启动渲染进程并截图，用于验收界面。
 * 用法：node scripts/shot.mjs
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// 虚拟/远程桌面环境下常常没有正常 GPU，禁掉更稳
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

ipcMain.handle('data:load', async () => null);
ipcMain.handle('data:save', async () => ({ ok: true }));
ipcMain.handle('data:location', async () => path.join(root, 'build', 'preview-data.json'));

await app.whenReady();

const win = new BrowserWindow({
  width: 1180,
  height: 820,
  show: true,
  backgroundColor: '#f5f4f1',
  webPreferences: {
    preload: path.join(root, 'electron', 'preload.cjs'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
});

await win.loadFile(path.join(root, 'dist', 'index.html'));
await new Promise((r) => setTimeout(r, 1500));

const image = await win.capturePage();
const out = path.join(root, 'build', 'screenshot.png');
writeFileSync(out, image.toPNG());
console.log('saved', out);
app.exit(0);
