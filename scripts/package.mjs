/**
 * 打包脚本：把 electron-builder 需要的缓存/临时目录都收进项目内，
 * 避免在受限环境（AppData 不可写、临时目录权限异常）下打包失败。
 * 用法：node scripts/package.mjs --win nsis portable
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = path.join(root, '.tmp');
const builderCache = path.join(root, '.builder-cache');
const electronCache = path.join(root, '.electron-cache');
for (const dir of [tmp, builderCache, electronCache]) mkdirSync(dir, { recursive: true });

const env = {
  ...process.env,
  TEMP: tmp,
  TMP: tmp,
  ELECTRON_BUILDER_CACHE: builderCache,
};
delete env.ELECTRON_RUN_AS_NODE;

const cli = path.join(root, 'node_modules', 'electron-builder', 'cli.js');
const args = [cli, ...process.argv.slice(2), `--config.electronDownload.cache=${electronCache}`];

// 镜像只在中国大陆需要，交给环境变量开启（见 README / .npmrc 注释）
if (process.env.ELECTRON_MIRROR) {
  args.push(`--config.electronDownload.mirror=${process.env.ELECTRON_MIRROR}`);
}
if (process.env.ELECTRON_BUILDER_BINARIES_MIRROR) {
  env.ELECTRON_BUILDER_BINARIES_MIRROR = process.env.ELECTRON_BUILDER_BINARIES_MIRROR;
}

// 如果本地准备了改过图标/版本信息的 Electron 分发目录，就用它（省一次下载）
const localDist = path.join(root, '.electron-dist');
if (existsSync(path.join(localDist, 'electron.exe'))) {
  args.push(`--config.electronDist=${localDist}`);
  console.log('[package] 使用本地 Electron 分发目录 .electron-dist');
}

console.log(`[package] electron-builder ${args.slice(1).join(' ')}`);
const child = spawn(process.execPath, args, { stdio: 'inherit', env, cwd: root });
child.on('exit', (code) => process.exit(code ?? 0));
