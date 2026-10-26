import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import electronPath from 'electron';

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const entry = path.join(process.cwd(), 'dist', 'index.html');
if (!existsSync(entry)) {
  console.error('[start] 还没构建前端，先跑 `pnpm build:web` 吧。');
  process.exit(1);
}

const child = spawn(electronPath, ['.'], { stdio: 'inherit', env });
child.on('exit', (code) => process.exit(code ?? 0));
