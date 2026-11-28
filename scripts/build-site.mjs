import { cp, mkdir, readdir, rm, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const site = path.join(root, 'site');
export const output = path.join(root, 'dist');
const publicExtensions = new Set([
  '.html', '.css', '.js', '.mjs', '.json', '.gif', '.jpg', '.jpeg', '.png', '.webp',
  '.svg', '.avif', '.ico', '.mp3', '.ogg', '.wav', '.mp4', '.webm', '.pdf', '.woff', '.woff2',
]);
const publicNames = new Set(['robots.txt', 'sitemap.xml', '_headers', '_redirects']);

function isPublicFile(name) {
  return !name.startsWith('.') && (publicNames.has(name) || publicExtensions.has(path.extname(name).toLowerCase()));
}

async function stagePublic(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isSymbolicLink()) throw new Error(`Public source must not contain symlinks: ${entry.name}`);
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) await stagePublic(from, to);
    else if (entry.isFile() && isPublicFile(entry.name)) await cp(from, to);
  }
}

async function syncDirectory(source, destination) {
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  const names = new Set(entries.map((entry) => entry.name));
  for (const old of await readdir(destination)) {
    if (!names.has(old)) await rm(path.join(destination, old), { recursive: true, force: true });
  }
  for (const entry of entries) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) await syncDirectory(from, to);
    else await cp(from, to);
  }
}

export async function buildSite() {
  const staging = await mkdtemp(path.join(os.tmpdir(), 'marlev-public-'));
  try {
    await stagePublic(site, staging);
    // Keep the served directory in place so Wrangler can watch later rebuilds.
    await syncDirectory(staging, output);
    console.log('Prepared dist/ from site/ (public assets only; source unchanged).');
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildSite();
}
