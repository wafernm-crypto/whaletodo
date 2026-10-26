import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import { promises as fs, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

/** 数据落在固定目录，开发版与安装版共用，方便以后备份 / 迁移 / 同步 */
const dataDir = path.join(app.getPath('appData'), 'WhaleTodo');
const dataFile = path.join(dataDir, 'data.json');
const backupFile = path.join(dataDir, 'data.bak.json');

let mainWindow = null;
let writeQueue = Promise.resolve();

async function ensureDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function readData() {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    // 主文件坏了就退回备份，再不行交回渲染进程重建
    try {
      const raw = await fs.readFile(backupFile, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

async function writeData(data) {
  // 串行写，且每次失败后让队列恢复可用，避免一次读写错误把后续保存全拖死
  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    await ensureDir();
    const payload = JSON.stringify(data, null, 2);
    const tmpFile = `${dataFile}.tmp`;
    await fs.writeFile(tmpFile, payload, 'utf8');
    try {
      await fs.copyFile(dataFile, backupFile);
    } catch {
      // 首次保存时没有旧文件，忽略
    }
    await fs.rename(tmpFile, dataFile);
  });
  try {
    await writeQueue;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 820,
    minHeight: 560,
    show: false,
    backgroundColor: '#f5f4f1',
    title: '鲸鱼待办',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // 外链一律交给系统浏览器
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (devServerUrl && url.startsWith(devServerUrl)) return;
    event.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('data:load', async () => readData());
ipcMain.handle('data:save', async (_event, data) => writeData(data));
ipcMain.handle('data:location', async () => dataFile);

// 窗口关闭时的同步保存，保证最后一次改动不丢
ipcMain.on('data:save-sync', (event, data) => {
  try {
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
    event.returnValue = { ok: true };
  } catch (err) {
    event.returnValue = { ok: false, error: err.message };
  }
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    if (!devServerUrl) Menu.setApplicationMenu(null);
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
