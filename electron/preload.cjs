const { contextBridge, ipcRenderer } = require('electron');

// 只暴露最小能力面：读写本地数据 + 查询路径
contextBridge.exposeInMainWorld('whaletodo', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
  // 关窗瞬间兜底用：同步写，避免异步 IPC 来不及完成
  saveSync: (data) => ipcRenderer.sendSync('data:save-sync', data),
  location: () => ipcRenderer.invoke('data:location'),
  platform: process.platform,
});
