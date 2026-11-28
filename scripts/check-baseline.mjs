import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = JSON.parse(await readFile(path.join(root, 'migration/content-baseline.json'), 'utf8'));
const changes = [];
for (const [name, expected] of Object.entries(baseline.files)) {
  try {
    const actual = createHash('sha256').update(await readFile(path.join(root, name))).digest('hex');
    if (actual !== expected) changes.push(`modified: ${name}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    changes.push(`missing: ${name}`);
  }
}
for (const name of await readdir(root)) {
  if (/\.(html|css)$/i.test(name) && !(name in baseline.files)) changes.push(`added: ${name}`);
}
if (changes.length) {
  console.error('HTML/CSS differs from the migration baseline:\n' + changes.join('\n'));
  console.error('Review external edits before intentionally updating the baseline.');
  process.exitCode = 1;
} else console.log(`All ${Object.keys(baseline.files).length} HTML/CSS files match baseline ${baseline.commit}.`);
