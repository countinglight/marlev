import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const usage = 'Usage: node scripts/check-site.mjs [--root <directory>]';
const args = process.argv.slice(2);
let rootArg = path.join(fileURLToPath(new URL('../', import.meta.url)), 'site');
if (args.length === 2 && args[0] === '--root') rootArg = args[1];
else if (args.length) throw new Error(usage);

const ROOT = path.resolve(rootArg);
const KNOWN_MISSING_FRAGMENTS = new Set(
  ['vitamins', 'flu', 'fever'].map((fragment) => `articles.html#${fragment}`),
);

async function findFiles(directory, extension) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await findFiles(location, extension));
    else if (entry.isFile() && path.extname(entry.name) === extension) files.push(location);
  }
  return files.sort();
}

function decodeReferences(value) {
  const replacements = new Map([
    ['lt', '<'], ['gt', '>'], ['quot', '"'], ['apos', "'"], ['amp', '&'],
  ]);
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (entity, name) => {
    if (name[0] === '#') {
      const radix = name[1].toLowerCase() === 'x' ? 16 : 10;
      const digits = radix === 16 ? name.slice(2) : name.slice(1);
      return String.fromCodePoint(Number.parseInt(digits, radix));
    }
    return replacements.get(name.toLowerCase()) ?? entity;
  });
}

function cssUrls(text) {
  const withoutComments = text.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...withoutComments.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)].map(
    (match) => match[2].trim(),
  );
}

function parseAttributes(source) {
  const attributes = new Map();
  const expression = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of source.matchAll(expression)) {
    attributes.set(match[1].toLowerCase(), decodeReferences(match[2] ?? match[3] ?? match[4] ?? ''));
  }
  return attributes;
}

function lineAt(text, offset) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text[index] === '\n') line += 1;
  }
  return line;
}

function parsePage(location, html) {
  const page = {
    location,
    ids: new Map(),
    refs: [],
    errors: [],
    warnings: [],
    tags: new Map(),
    title: [],
    inTitle: false,
    lang: false,
    charset: false,
    viewport: false,
    doctype: false,
  };
  const tags = /<!--[\s\S]*?-->|<!doctype\s+html\s*>|<![^>]*>|<\/?[a-z][^>]*>/gi;
  let cursor = 0;
  for (const match of html.matchAll(tags)) {
    if (page.inTitle && match.index > cursor) {
      page.title.push(decodeReferences(html.slice(cursor, match.index)));
    }
    cursor = match.index + match[0].length;
    const token = match[0];
    if (token.startsWith('<!--') || token.startsWith('<![')) continue;
    if (/^<!doctype\s+html\s*>$/i.test(token)) {
      page.doctype = true;
      continue;
    }
    if (token.startsWith('<!')) continue;
    const closing = /^<\s*\//.test(token);
    const nameMatch = token.match(/^<\s*\/?\s*([a-z][^\s/>]*)/i);
    if (!nameMatch) continue;
    const tag = nameMatch[1].toLowerCase();
    if (closing) {
      if (tag === 'title') page.inTitle = false;
      continue;
    }

    const line = lineAt(html, match.index);
    const attributes = parseAttributes(token.slice(nameMatch[0].length, -1));
    page.tags.set(tag, (page.tags.get(tag) ?? 0) + 1);
    if (attributes.has('id')) {
      const id = attributes.get('id');
      page.ids.set(id, (page.ids.get(id) ?? 0) + 1);
    }
    if (tag === 'html') page.lang = Boolean(attributes.get('lang'));
    if (tag === 'title') page.inTitle = true;
    if (tag === 'meta') {
      page.charset ||= attributes.get('charset')?.toLowerCase() === 'utf-8';
      page.viewport ||= attributes.get('name')?.toLowerCase() === 'viewport'
        && Boolean(attributes.get('content'));
    }
    if (tag === 'img' && !attributes.has('alt')) {
      page.errors.push(`line ${line}: image is missing alt attribute`);
    }
    for (const attribute of ['href', 'src', 'poster', 'action']) {
      const value = attributes.get(attribute);
      if (value) page.refs.push([line, value]);
    }
    if (tag === 'form' && attributes.get('action')?.includes('YOUR_FORM_ID')) {
      page.warnings.push(`line ${line}: known Formspree placeholder; form delivery is not configured`);
    }
    for (const url of cssUrls(attributes.get('style') ?? '')) {
      page.refs.push([line, url]);
    }
  }
  if (page.inTitle && cursor < html.length) {
    page.title.push(decodeReferences(html.slice(cursor)));
  }
  return page;
}

function isWithinRoot(location) {
  const relative = path.relative(ROOT, location);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function isFile(location) {
  try {
    return (await stat(location)).isFile();
  } catch {
    return false;
  }
}

async function isDirectory(location) {
  try {
    return (await stat(location)).isDirectory();
  } catch {
    return false;
  }
}

async function main() {
  const errors = [];
  const warnings = [];
  const pages = new Map();
  let htmlFiles = [];
  try {
    htmlFiles = await findFiles(ROOT, '.html');
  } catch (error) {
    errors.push(`cannot read site root: ${error.message}`);
  }

  for (const location of htmlFiles) {
    let page;
    try {
      page = parsePage(location, await readFile(location, 'utf8'));
    } catch (error) {
      errors.push(`${path.basename(location)}: cannot read/parse HTML: ${error.message}`);
      continue;
    }
    pages.set(path.resolve(location), page);
    for (const [label, valid] of [
      ['HTML5 doctype', page.doctype],
      ['html language', page.lang],
      ['UTF-8 charset', page.charset],
      ['viewport metadata', page.viewport],
      ['nonempty title', Boolean(page.title.join('').trim())],
      ['exactly one main element', page.tags.get('main') === 1],
      ['exactly one h1 element', page.tags.get('h1') === 1],
    ]) {
      if (!valid) page.errors.push(`missing or invalid ${label}`);
    }
    for (const [id, count] of page.ids) {
      if (count > 1) page.errors.push(`duplicate id '${id}'`);
    }
    errors.push(...page.errors.map((item) => `${path.basename(location)}: ${item}`));
    warnings.push(...page.warnings.map((item) => `${path.basename(location)}: ${item}`));
  }

  if (!pages.has(path.join(ROOT, 'index.html'))) {
    errors.push('site must contain a readable index.html');
  }

  async function checkRef(source, line, value) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//')) return;
    const hash = value.indexOf('#');
    const query = value.indexOf('?');
    const pathEnd = Math.min(
      hash < 0 ? value.length : hash,
      query < 0 ? value.length : query,
    );
    let relative;
    let fragment;
    try {
      relative = decodeURIComponent(value.slice(0, pathEnd));
      fragment = hash < 0 ? '' : decodeURIComponent(value.slice(hash + 1));
    } catch (error) {
      errors.push(`${path.basename(source)}:${line}: invalid URL '${value}': ${error.message}`);
      return;
    }
    let target = !relative
      ? source
      : path.resolve(relative.startsWith('/') ? ROOT : path.dirname(source), relative.replace(/^[/\\]+/, ''));
    if (!isWithinRoot(target)) {
      errors.push(`${path.basename(source)}:${line}: reference escapes site root: ${value}`);
      return;
    }
    if (await isDirectory(target)) target = path.join(target, 'index.html');
    if (!await isFile(target)) {
      errors.push(`${path.basename(source)}:${line}: missing local target: ${value}`);
    } else if (fragment && pages.has(target) && !pages.get(target).ids.has(fragment)) {
      const message = `${path.basename(source)}:${line}: missing fragment: ${value}`;
      if (KNOWN_MISSING_FRAGMENTS.has(`${path.basename(target)}#${fragment}`)) {
        warnings.push(`${message} (existing missing article content)`);
      } else {
        errors.push(message);
      }
    }
  }

  for (const page of pages.values()) {
    for (const [line, value] of page.refs) await checkRef(page.location, line, value);
  }
  for (const location of await findFiles(ROOT, '.css')) {
    try {
      for (const value of cssUrls(await readFile(location, 'utf8'))) {
        await checkRef(location, 'CSS', value);
      }
    } catch (error) {
      errors.push(`${path.basename(location)}: cannot read stylesheet: ${error.message}`);
    }
  }
  for (const message of warnings) console.log(`WARNING: ${message}`);
  for (const message of errors) console.log(`ERROR: ${message}`);
  console.log(`Checked ${pages.size} HTML pages: ${errors.length} error(s), ${warnings.length} warning(s).`);
  return errors.length ? 1 : 0;
}

process.exitCode = await main();
