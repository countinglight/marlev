# Website migration status

## Completed content reconciliation

The prepared repository is /Users/vlads/ws/git/countinglight/marlev. The separately
supplied /Users/vlads/ws/git/marlev is an older non-Git folder and was not changed.
Input: marlev.lerapc, whose HEAD matches the original baseline 7b3b680. All its
HTML/CSS working-tree changes were imported, normalizing CRLF to LF. Root input
photos, unused image variants, old tooling, and Git metadata were not imported.
The input folder was left untouched.

Commit 64b5d86 imports eight pages, CSS, and referenced images/audio. The Online
Payments page and the new office address (8201 164th Ave NE, Suite 200) are intentional
incoming changes. content-import.json records hashes. The subsequent reorganization
moves public source into site/, retaining the same URLs and contents. No framework
conversion or medical/payment copy rewrite is part of the migration.

The original content-baseline.json is historical. The temporary freeze has ended.
Normal CI checks source and generated output; it no longer freezes content hashes.
`npm run verify:import` is a one-time preservation check for the import/move.

## Structure

- site/: editable website HTML/CSS, images, audio, and future static assets.
- apps/: separate future client-app source/toolchains; see apps/README.md.
- scripts/: website build, watcher, and structural checker.
- dist/: generated public-only output, ignored by Git.
- wrangler.site.jsonc: marlev-site-preview Worker; no custom domains/routes.

The builder recursively copies permitted public file types, excludes dotfiles and
Markdown/development files, refuses symlinks, and removes stale output. It does not
publish apps/ automatically; add explicit output composition with the first app.
Relative URLs stay unchanged because site/ contents are published at the URL root.

## Hosting status

PR #3 merged into master as b21370e and its automatic Worker deployment passed.
The current public domain marlev.countinglight.com now serves that website through
Worker marlev-site-preview. Its historical internal name does not imply test-only
hosting. The custom domain is declared in wrangler.site.jsonc.

Pages automatic production deployments are disabled. The former Pages domain
attachment and CNAME to marlev.pages.dev were removed; Wrangler created the Worker
custom domain. The old Pages deployment remains available at marlev.pages.dev for
rollback. No Pages project or historical deployment was deleted.

Only a future move to marlev.com / www.marlev.com is deferred. Normal approved
publishing means merge into master and verify marlev.countinglight.com.

Worker Git builds use npm run build, then npx wrangler deploy -c wrangler.site.jsonc
on master; branches use npx wrangler preview -c wrangler.site.jsonc. Node 22.20.0.
GitHub app connection and existing build token are retained. No credentials are
stored in the repository. Branch protection remains intentionally deferred.

## Known content limitations

Formspree still contains YOUR_FORM_ID; three article fragments remain absent.
The supplied payment password gate is client-side only, not actual authentication.
No payment/contact submissions are performed during testing. Editorial changes are
preserved; owner review of those business details precedes publication.
