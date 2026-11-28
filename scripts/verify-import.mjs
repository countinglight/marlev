// Historical migration check, not a permanent content freeze. Future content
// edits can differ; use normal structural checks for ongoing editing.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const report = JSON.parse(await readFile(path.join(root, 'migration/content-import.json'), 'utf8'));
for (const file of [...report.files, ...report.referenced_assets]) {
  const expected = file.imported_sha256 ?? file.sha256;
  for (const folder of ['site', 'dist']) {
    const actual = createHash('sha256').update(await readFile(path.join(root, folder, file.path))).digest('hex');
    if (actual !== expected) throw new Error(`Historical import differs: ${folder}/${file.path}`);
  }
}
console.log('Imported HTML/CSS and referenced assets are unchanged through site/ and dist/.');
