/**
 * 开发辅助：用 Chrome DevTools Protocol 打开页面、可选点击某个元素、然后截图。
 * 用法：
 *   node scripts/ui-shot.mjs --url http://127.0.0.1:4178/ --out build/ui.png
 *   node scripts/ui-shot.mjs --url ... --out ... --click 'button[title="事项设置（条件 / 状态）"]'
 * 可选：--width 1180 --height 860 --scale 2 --wait 700 --port 9333
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] != null ? argv[i + 1] : fallback;
};

const url = arg('url', 'http://127.0.0.1:4178/');
const out = path.resolve(arg('out', 'build/ui-shot.png'));
const width = Number(arg('width', 1180));
const height = Number(arg('height', 860));
const scale = Number(arg('scale', 2));
const clickSelector = arg('click', null);
const waitMs = Number(arg('wait', 700));
const port = Number(arg('port', 9333));
const settleMs = Number(arg('settle', 900));

const chromePath = arg('chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
const profile = path.resolve('build/chrome-cdp');
mkdirSync(profile, { recursive: true });

const child = spawn(
  chromePath,
  [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, timeout = 20000, step = 200) {
  const started = Date.now();
  for (;;) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {
      // 还没起来，继续等
    }
    if (Date.now() - started > timeout) throw new Error('等待 Chrome 超时');
    await sleep(step);
  }
}

const version = await waitFor(async () => {
  const r = await fetch(`http://127.0.0.1:${port}/json/version`);
  return r.ok ? r.json() : null;
});
void version;

const targets = await waitFor(async () => {
  const r = await fetch(`http://127.0.0.1:${port}/json/list`);
  const list = r.ok ? await r.json() : [];
  return list.find((t) => t.type === 'page') ?? null;
});

const ws = new WebSocket(targets.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let seq = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = (seq += 1);
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: false,
  });

  // 先打开同源页面，再注入 localStorage，最后刷新——避免 404 的种子页
  const seedPath = arg('seed', null);
  await send('Page.navigate', { url });
  await sleep(settleMs);

  if (seedPath) {
    const seedJson = readFileSync(path.resolve(seedPath), 'utf8');
    const injected = await send('Runtime.evaluate', {
      expression: `(() => {
        localStorage.setItem('whaletodo.data.v1', ${JSON.stringify(seedJson)});
        return localStorage.getItem('whaletodo.data.v1') ? 'seeded' : 'failed';
      })()`,
      returnByValue: true,
    });
    console.log(`[seed] ${injected.result?.value}`);
    await send('Page.reload', { ignoreCache: true });
    await sleep(settleMs);
  }

  await sleep(waitMs);

  const clickSelectors = [];
  argv.forEach((value, index) => {
    if (value === '--click' && argv[index + 1] != null) clickSelectors.push(argv[index + 1]);
  });
  if (clickSelector && clickSelectors.length === 0) clickSelectors.push(clickSelector);

  for (const selector of clickSelectors) {
    const result = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return 'not-found';
        el.click();
        return 'clicked';
      })()`,
      returnByValue: true,
    });
    console.log(`[click] ${selector} -> ${result.result?.value}`);
    await sleep(waitMs);
  }

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log(`[shot] ${out}`);
} finally {
  try {
    await send('Browser.close');
  } catch {
    // ignore
  }
  ws.close();
  child.kill();
}
