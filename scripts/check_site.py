#!/usr/bin/env python3
"""Dependency-free static-site smoke checks; not a complete HTML validator."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
# Existing article destinations have no supplied content. Keep visible warnings
# without hiding any new broken links or inventing article/medical content.
KNOWN_MISSING_FRAGMENTS = {('articles.html', item) for item in ('vitamins', 'flu', 'fever')}


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = Counter()
        self.refs = []
        self.errors = []
        self.warnings = []
        self.tags = Counter()
        self.title = []
        self.in_title = False
        self.lang = False
        self.charset = False
        self.viewport = False
        self.doctype = False

    def handle_decl(self, decl):
        if decl.lower() == 'doctype html':
            self.doctype = True

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        line = self.getpos()[0]
        self.tags[tag] += 1
        if attrs.get('id'):
            self.ids[attrs['id']] += 1
        if tag == 'html':
            self.lang = bool(attrs.get('lang'))
        if tag == 'title':
            self.in_title = True
        if tag == 'meta':
            self.charset |= attrs.get('charset', '').lower() == 'utf-8'
            self.viewport |= attrs.get('name', '').lower() == 'viewport' and bool(attrs.get('content'))
        if tag == 'img' and 'alt' not in attrs:
            self.errors.append(f'line {line}: image is missing alt attribute')
        for attr in ('href', 'src', 'poster', 'action'):
            if attrs.get(attr):
                self.refs.append((line, attrs[attr]))
        if tag == 'form' and 'YOUR_FORM_ID' in attrs.get('action', ''):
            self.warnings.append(f'line {line}: known Formspree placeholder; form delivery is not configured')
        for url in css_urls(attrs.get('style', '')):
            self.refs.append((line, url))

    handle_startendtag = handle_starttag

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)


def css_urls(text):
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    return [match.group(2).strip() for match in
            re.finditer(r'''url\(\s*(['"]?)(.*?)\1\s*\)''', text, flags=re.I)]


def main():
    errors, warnings = [], []
    pages = {}
    for path in sorted(ROOT.glob('*.html')):
        page = Page(path)
        try:
            page.feed(path.read_text(encoding='utf-8'))
            page.close()
        except (UnicodeError, OSError, ValueError) as exc:
            errors.append(f'{path.name}: cannot read/parse HTML: {exc}')
            continue
        pages[path.resolve()] = page
        for label, ok in (
            ('HTML5 doctype', page.doctype), ('html language', page.lang),
            ('UTF-8 charset', page.charset), ('viewport metadata', page.viewport),
            ('nonempty title', bool(''.join(page.title).strip())),
            ('exactly one main element', page.tags['main'] == 1),
            ('exactly one h1 element', page.tags['h1'] == 1),
        ):
            if not ok:
                page.errors.append(f'missing or invalid {label}')
        for ident, count in page.ids.items():
            if count > 1:
                page.errors.append(f'duplicate id {ident!r}')
        errors.extend(f'{path.name}: {item}' for item in page.errors)
        warnings.extend(f'{path.name}: {item}' for item in page.warnings)

    if not pages or not (ROOT / 'index.html').resolve() in pages:
        errors.append('site must contain a readable index.html')

    def check_ref(source, line, value):
        try:
            url = urlsplit(value)
        except ValueError as exc:
            errors.append(f'{source.name}:{line}: invalid URL {value!r}: {exc}')
            return
        if url.scheme or url.netloc:
            return  # External services need a separate online check.
        relative = unquote(url.path)
        target = (source if not relative else
                  (ROOT / relative.lstrip('/')) if relative.startswith('/') else
                  (source.parent / relative)).resolve()
        if not target.is_relative_to(ROOT):
            errors.append(f'{source.name}:{line}: reference escapes site root: {value}')
            return
        if target.is_dir():
            target /= 'index.html'
        if not target.is_file():
            errors.append(f'{source.name}:{line}: missing local target: {value}')
        elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            message = f'{source.name}:{line}: missing fragment: {value}'
            if (target.name, unquote(url.fragment)) in KNOWN_MISSING_FRAGMENTS:
                warnings.append(message + ' (existing missing article content)')
            else:
                errors.append(message)

    for path, page in pages.items():
        for line, value in page.refs:
            check_ref(path, line, value)
    for path in sorted(ROOT.glob('*.css')):
        try:
            for value in css_urls(path.read_text(encoding='utf-8')):
                check_ref(path, 'CSS', value)
        except (OSError, UnicodeError) as exc:
            errors.append(f'{path.name}: cannot read stylesheet: {exc}')
    for message in warnings:
        print(f'WARNING: {message}')
    for message in errors:
        print(f'ERROR: {message}')
    print(f'Checked {len(pages)} HTML pages: {len(errors)} error(s), {len(warnings)} warning(s).')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
