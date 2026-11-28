# Athena Holistic Health website

Repository: https://github.com/countinglight/marlev. Default branch: `master`.
Migration and imported content are on `vlads-dev`, under review in PR #3.

The website is hand-authored HTML/CSS in `site/`. Node/Wrangler builds public-only
`dist/` and provides local preview. Future client apps have separate source and
tooling under `apps/` (see apps/README.md). No mobile infrastructure is included.

## Edit through chat

Open this repository in Codex or Claude Code. `AGENTS.md` defines the workflow;
`CLAUDE.md` imports it. Ask for text, images, or layout changes in ordinary language.
Ask “What can I do?” for the operations menu, “What changed?” for a summary, or
“Show me a preview” to review. The agent handles checks, commits, pushes, and PRs.
An editing request prepares changes for review; an explicit publishing request is
needed to merge. Domain transfer is a separate final approval during migration.

## Local setup and preview

Use Node 22 (`.nvmrc` pins 22.20.0), npm 10, and Python 3 for the structural checker.

```sh
npm ci
npm run build
npm run preview:site
```

Open http://127.0.0.1:8787. The server binds to loopback, watches site/ recursively,
and rebuilds public assets with live reload. Ctrl+C stops it. For another port:
`npm run preview:site -- --port 8788`. `npm run preview:built` serves an existing
build without the source watcher. The legacy `./serve.sh` serves site/ with Python
on port 8000; prefer Wrangler. Edit site/, never generated dist/.

The build validates source and generated output: local links/fragments, images,
stylesheets, metadata, IDs, and alt attributes. It is not a full HTML/CSS validator
or third-party-service test. Check visual changes in desktop and mobile browsers.

## Website files

| File in site/ | Purpose |
| --- | --- |
| index.html | English home page |
| russian.html | Russian home page |
| about-homeopathy.html | About homeopathy |
| acute-conditions.html | Acute conditions |
| articles.html | Articles, resources, meditation audio |
| online-payments.html | Supplied payment information and PayPal link |
| contact.html | Contact information and placeholder form |
| directions.html | Office map and arrival information |
| styles.css | Shared styles |
| images/, audio/ | Public media |

Shared headers/navigation/footers are repeated in HTML. Keep shared changes
consistent while preserving the Russian page’s intentionally different navigation.
The imported copy’s current office is 8201 164th Ave NE, Suite 200, Redmond, WA 98052.

## Hosting during migration

Existing production is Cloudflare Pages at https://marlev.countinglight.com/ and
https://marlev.pages.dev/. Its production/source branch is master. The previous
production deployment must remain serving until domain cutover is approved.
www.marlev.com is not attached to this Pages project; verify its hosting separately.

The isolated Worker has no production domains:
https://marlev-site-preview.vlad-sadovsky.workers.dev/.

```sh
npx wrangler login
npm run deploy:test
```

This builds/checks then deploys only `marlev-site-preview`, configured by
wrangler.site.jsonc. `npm run preview:branch` builds and invokes Wrangler’s branch
preview command; it needs Cloudflare access. Retrieve actual URLs from command/build
output. Never guess a preview URL. Local preview needs no Cloudflare login.

Worker Git builds are connected to countinglight/marlev: master deployments and
automatic branch previews, using the explicit wrangler.site.jsonc configuration.
Before merging the migration, verify the branch build and disable Pages automatic
production deployments so its former
root-output configuration cannot publish the reorganized repository. No domain
transfer occurs merely by configuring this Worker; use its workers.dev URL for
verification. Branch protection remains deferred. See migration/README.md for
current verification and cutover steps.

## Import history and limitations

The external edited folder was left untouched. Content import and source moves
are separate commits. migration/content-import.json records input/import hashes,
referenced assets, and normalization from CRLF to LF. Old baseline metadata remains
for history. `npm run verify:import` checks that imported bytes survived this move;
it is not a required check for later intentional content edits.

Four existing structural warnings remain: Formspree YOUR_FORM_ID and three absent
article fragments (#vitamins, #flu, #fever). The supplied Online Payments password
dialog runs only in the browser; page source/fee content remains public and it
is not secure access control. Real access control would need a separate request.
Payment/contact submissions and external service availability are not tested by
the build; do not submit real transactions or test messages during visual checks.
