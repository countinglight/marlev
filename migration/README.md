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

## Hosting and final cutover

Existing Pages project: marlev. Production/source branches: master. Existing domains:
marlev.countinglight.com and marlev.pages.dev. www.marlev.com is not attached to it;
its existing hosting/DNS needs separate confirmation. No domains have been moved.
Test Worker: https://marlev-site-preview.vlad-sadovsky.workers.dev/.

Workers is the agreed target for all project surfaces. Before merging PR #3:

1. Verify imported desktop/mobile pages, local links, audio, payment dialog display,
   form targets, .html/clean URLs, 404 handling, and private-file exclusion.
2. Worker Git-connected builds are now configured for master and branch previews:
   build command npm run build; deploy npx wrangler deploy -c wrangler.site.jsonc;
   preview npx wrangler preview -c wrangler.site.jsonc; root /; Node 22.20.0.
3. Trigger a real branch build and inspect its resulting hosted content. A manual
   wrangler deploy validates packaging/hosting, not the automatic Git pipeline.
4. Disable Pages automatic production deployments before merging this source move.
   Keep its current production deployment online; its old root-output build is no
   longer suitable for the reorganized repository. Save Pages settings for rollback.
5. Merge only after an explicit publishing request. Verify the master Worker build.
6. Transfer production domains only as the final separately approved step. Verify
   TLS, redirects, root/www behavior, maps, contact/payments, and rollback then.

The Worker Git connection was completed in Chrome using the existing Cloudflare
GitHub app and existing build token. No new token or expanded token permissions
were created. The checked-in .nvmrc supplies Node 22.20.0. The Wrangler OAuth
session itself still does not grant the Builds API configuration scope; dashboard
access was used for configuration. No credentials were copied into the repository.
Production branch protection is deferred; no separate deploy branch is introduced.

## Known content limitations

Formspree still contains YOUR_FORM_ID; three article fragments remain absent.
The supplied payment password gate is client-side only, not actual authentication.
No payment/contact submissions are performed during testing. Editorial changes are
preserved; owner review of those business details precedes publication.
