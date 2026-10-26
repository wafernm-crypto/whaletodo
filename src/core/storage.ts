import type { AppData } from './types';

/**
 * 存储桥：桌面端走 Electron IPC 落到本地 JSON 文件；
 * 移动端/网页预览时回退到 localStorage。接口保持最小，方便后续替换成 SQLite。
 */
export interface StorageBridge {
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
  /** 数据文件位置，用于在界面上告诉用户「东西存哪了」 */
  location?(): Promise<string>;
}

declare global {
  interface Window {
    whaletodo?: {
      load(): Promise<AppData | null>;
      save(data: AppData): Promise<{ ok: boolean; error?: string }>;
      saveSync?(data: AppData): { ok: boolean; error?: string };
      location(): Promise<string>;
      platform: string;
    };
  }
}

const LS_KEY = 'whaletodo.data.v1';

export const webStorage: StorageBridge = {
  async load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as AppData) : null;
    } catch {
      return null;
    }
  },
  async save(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  },
  async location() {
    return '浏览器 localStorage';
  },
};

export const desktopStorage: StorageBridge = {
  async load() {
    if (!window.whaletodo) return null;
    return window.whaletodo.load();
  },
  async save(data) {
    if (!window.whaletodo) return;
    const res = await window.whaletodo.save(data);
    if (!res.ok) throw new Error(res.error ?? '保存失败');
  },
  async location() {
    if (!window.whaletodo) return '未知';
    return window.whaletodo.location();
  },
};

export function createStorage(): StorageBridge {
  return typeof window !== 'undefined' && window.whaletodo ? desktopStorage : webStorage;
}
