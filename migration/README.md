# Staged Node/Wrangler migration

## Status and scope

GitHub default branch: `master` (renamed from `main`). Preparation branch:
`vlads-dev`, originally based on `7b3b680f96ef27cb39219a50d0111fa7f3b059ee`.
Production remains on Cloudflare Pages. No production domain transfer is authorized
in this stage. Branch protection is still deferred.

Cloudflare access has been authenticated. Pages production_branch and its Git
source production_branch were explicitly changed from main to master and read
back through the API. Existing domains were retained: marlev.pages.dev and
marlev.countinglight.com. www.marlev.com is not attached to this Pages project;
do not transfer that hostname without separately checking its current hosting.
The checked-in CI push trigger and agent instructions now use master; they reach
master only when the preparation PR is eventually merged.

## Preserve external content edits

The seven root HTML pages and styles.css are frozen byte-for-byte against
`content-baseline.json`. The base commit preserves the original contents;
the manifest contains SHA-256 hashes. Assets also remain in their original paths.
No framework conversion, source moves, or template rewriting occurs in this stage.

When the other computer's editing is finished:

1. Obtain its complete HTML/CSS folder, plus any newly referenced assets. Ask which
   original version it started from; our baseline is the current published address
   update, so an older external copy may otherwise restore the former address.
2. Retain that folder unchanged outside the repository as the incoming copy.
3. Compare each incoming file with both the baseline commit and the current source.
   If the incoming work started before the baseline, use its true starting version
   for three-way reconciliation. Never overwrite the new address/help changes blindly.
4. Import reviewed HTML/CSS into their current root paths. Preserve unrelated files.
   Track new pages and stylesheet/image references; missing files are not implicit
   deletions. Do not copy Git metadata, credentials, package files, or tooling.
5. Run npm run build and browser checks, then commit content changes separately.
   Intentionally update the baseline hashes only after review, or remove the
   temporary baseline CI gate once the content hold ends. Do not hide a failure
   by automatically regenerating the manifest.
6. In a separate commit move public source into site/, adapt the build/checker,
   and prove public URLs and copied bytes are unchanged.

## Prepared architecture

Current (no source moves):

- Root HTML/CSS and images/: existing editable site.
- scripts/: build, validation, source watcher, and migration checks.
- dist/: generated public-only output, ignored by Git.
- wrangler.site.jsonc: isolated test Worker, no production domains.

Target after importing external edits:

- site/: hand-authored website and its assets.
- apps/<name>/: each client app's source and separate package/lockfile/toolchain.
- dist/: assembled public output from the site and explicitly selected app builds.

Small self-contained browser apps may publish under /apps/<name>/; configure each
build's base path and routing accordingly. Apps that require root routing, distinct
headers, backend services, or isolation should get their own Worker/subdomain and
Wrangler config, as Luciddream separates site and applications. Do not add Expo,
mobile dependencies, or a shared mandatory app build to the website. Copy only
generated app artifacts into dist/, never package files, node_modules, or source.
No sample app is created until there is an actual app requirement.

## Testing and cutover checklist

- npm ci; npm run build; npm run check:baseline.
- npm run preview:site; verify all seven pages, images, CSS, clean and .html URLs,
  missing-page 404, and absence of repository/private files at public URLs.
- Verify source changes rebuild and reload; exercise watcher using a temporary
  fixture, not the frozen source.
- Once logged in: wrangler whoami; npm run deploy:test; record actual Worker URL.
- Verify the hosted test Worker, then configure Git/branch previews for the eventual
  production Worker using current Cloudflare documentation (Luciddream's older
  versions-upload preview instructions are not copied automatically).
- After external import, test root and www domains, redirects, TLS, maps, and forms.
- Transfer domains only at the later approved cutover. Keep the Pages project and
  record its settings for rollback; ensure only the selected pipeline publishes.
- Production publishing remains merge-to-master; no separate deploy branch is added.

For a renamed clone: git branch -m main master; git fetch origin; git branch
--set-upstream-to=origin/master master; git remote set-head origin -a. Those are
one-time clone updates, not commands to run on an arbitrary editing branch.

## Preparation verification

- Clean npm ci and dependency audit: passed, zero reported vulnerabilities.
- Build and baseline check: passed; all eight HTML/CSS sources unchanged.
- All seven pages, stylesheet/image bytes, .html redirects, and missing/private
  file 404 responses: verified through local Wrangler HTTP requests.
- Contact and directions pages: inspected in the in-app browser through Wrangler.
- Repeated edits, source deletion cleanup, and shutdown/port release: verified in
  disposable copies using the actual Node binary (not the Volta launcher shim).
- Test Worker deploy --dry-run: passed, 16 public files packaged.
- Four existing content warnings remain as documented in the main README.
- Pages production and source branches: master, verified via authenticated API.
- Hosted test Worker created: marlev-site-preview.
  URL: https://marlev-site-preview.vlad-sadovsky.workers.dev/
  Version: b58b86db-4d20-466c-befc-8132d42743a1.
- Hosted pages, exact CSS/banner bytes, and private/unknown-file 404s: passed.
- The test Worker has no production custom domains and is manually deployed;
  Git-connected builds remain a later step before production cutover.
- Workers is the agreed long-term target for all project surfaces. Cloudflare
  recommends Workers for new projects; keeping Pages now is only transitional.
