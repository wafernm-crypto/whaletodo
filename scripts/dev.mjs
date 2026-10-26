import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import electronPath from 'electron';

// 某些环境（包括部分 IDE / 托管终端）会预设 ELECTRON_RUN_AS_NODE=1，
// 那样 electron 会退化成纯 Node，窗口根本起不来，这里必须清掉。
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const server = await createServer();
await server.listen();
server.printUrls();

const url = server.resolvedUrls?.local?.[0] ?? 'http://localhost:5173/';
console.log(`\n[dev] 正在启动 Electron，加载 ${url}\n`);

const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env: { ...env, VITE_DEV_SERVER_URL: url },
});

child.on('exit', async (code) => {
  await server.close();
  process.exit(code ?? 0);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    child.kill();
  });
}
