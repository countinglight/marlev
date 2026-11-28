import { watch } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { buildSite, isRootAsset, root } from './build-site.mjs';

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--port' ||
    !/^\d+$/.test(args[1]) || Number(args[1]) < 1 || Number(args[1]) > 65535)) {
  throw new Error('Usage: npm run preview:site -- --port <1-65535>');
}
const port = args[1] ?? '8787';
await buildSite();
const cli = path.join(root, 'node_modules/wrangler/bin/wrangler.js');
const server = spawn(process.execPath, [cli, 'dev', '--config', 'wrangler.site.jsonc',
  '--ip', '127.0.0.1', '--port', port, '--live-reload'], { cwd: root, stdio: 'inherit', detached: process.platform !== 'win32' });
let timer;
let pending = Promise.resolve();
function rebuild() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    pending = pending.then(buildSite).catch((error) => console.error('Rebuild failed:', error.message));
  }, 150);
}
const watchers = [
  watch(root, (_, name) => { if (name && isRootAsset(String(name))) rebuild(); }),
  watch(path.join(root, 'images'), { recursive: true }, rebuild),
];
let stopping = false;
function stop(signal = 'SIGINT', exitCode = 0) {
  if (stopping) return;
  stopping = true;
  clearTimeout(timer);
  const signalServer = (nextSignal) => {
    try {
      if (process.platform === 'win32') server.kill(nextSignal);
      else process.kill(-server.pid, nextSignal);
    } catch (error) {
      if (error.code !== 'ESRCH') console.error(error.message);
    }
  };
  signalServer(signal);
  // Process exit closes file watchers after server descendants have stopped.
  // Bound shutdown in case the runtime does not respond to the first signal.
  setTimeout(() => {
    signalServer('SIGKILL');
    process.exit(exitCode);
  }, 1500);
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
server.on('error', (error) => { console.error(error.message); stop('SIGINT', 1); });
server.on('exit', (code) => stop('SIGINT', code ?? 0));
