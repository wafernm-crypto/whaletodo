/**
 * 准备本地 Electron 分发目录（.electron-dist），并把图标 / 版本信息写进 electron.exe。
 *
 * electron-builder 默认会从下载缓存里解压原版 electron，产物就带着 Electron 默认图标；
 * 我们让它改用这个目录（scripts/package.mjs 会自动检测），图标和中文产品信息就对了。
 *
 * 本地已有 .electron-dist 时直接跳过；CI 上会现场复制 + 改资源。
 */
import { copyFile, cp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rcedit } from 'rcedit';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'node_modules', 'electron', 'dist');
const dstDir = path.join(root, '.electron-dist');
const target = path.join(dstDir, 'electron.exe');

if (!existsSync(srcDir)) {
  console.error('[prepare-dist] 没找到 node_modules/electron/dist，先跑 npm ci');
  process.exit(1);
}

if (existsSync(target)) {
  console.log('[prepare-dist] .electron-dist 已存在，跳过');
  process.exit(0);
}

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

console.log(`[prepare-dist] 复制 ${srcDir} -> ${dstDir}`);
await cp(srcDir, dstDir, { recursive: true });

const options = {
  icon: path.join(root, 'build', 'icon.ico'),
  'file-version': pkg.version,
  'product-version': pkg.version,
  'version-string': {
    ProductName: pkg.productName,
    FileDescription: `${pkg.productName} - ${pkg.description}`,
    CompanyName: pkg.author,
    LegalCopyright: `MIT License © ${pkg.author}`,
  },
};

console.log('[prepare-dist] 写入图标与版本信息');
try {
  await rcedit(target, options);
} catch (err) {
  // 某些虚拟文件系统 / 安全软件会让 rcedit 无法提交资源改动（Unable to commit changes）。
  // 退一步：拷到系统临时目录改完再覆盖回来；还不行就只警告，不阻断打包。
  console.warn(`[prepare-dist] 原地修改失败（${err.message}），改到临时目录重试`);
  const temp = path.join(os.tmpdir(), `whaletodo-electron-${Date.now()}.exe`);
  try {
    await copyFile(target, temp);
    await rcedit(temp, options);
    await copyFile(temp, target);
  } catch (retryErr) {
    console.warn(`[prepare-dist] 仍然失败（${retryErr.message}），跳过图标写入，继续打包`);
    console.warn('[prepare-dist] 产物会使用 Electron 默认图标与版本信息');
  } finally {
    await rm(temp, { force: true });
  }
}

console.log('[prepare-dist] 完成');
