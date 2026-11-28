import { cp, mkdir, readdir, rm, mkdtemp, lstat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const output = path.join(root, 'dist');
const rootAssets = new Set(['robots.txt', 'sitemap.xml', 'favicon.ico', '_headers', '_redirects']);
const imageExtensions = new Set(['.gif', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.avif', '.ico']);

export function isRootAsset(name) {
  return /\.(html|css)$/i.test(name) || rootAssets.has(name);
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
  // Generate output only: source HTML/CSS remains at its existing path until
  // the external editing pass is imported. Never serve the repository root.
  const staging = await mkdtemp(path.join(os.tmpdir(), 'marlev-public-'));
  try {
    let count = 0;
    for (const entry of await readdir(root, { withFileTypes: true })) {
      if (entry.isFile() && isRootAsset(entry.name)) {
        await cp(path.join(root, entry.name), path.join(staging, entry.name));
        count++;
      }
    }
    const images = path.join(root, 'images');
    await cp(images, path.join(staging, 'images'), {
      recursive: true,
      filter: async (source) => {
        const stat = await lstat(source);
        if (stat.isSymbolicLink()) return false;
        return stat.isDirectory() || imageExtensions.has(path.extname(source).toLowerCase());
      },
    });
    // Keep the served directory itself in place: replacing it invalidates
    // Wrangler's asset watcher. Sync only after the next output is prepared.
    await syncDirectory(staging, output);
    console.log(`Prepared dist/: ${count} root assets plus images (source files unchanged).`);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildSite();
}
