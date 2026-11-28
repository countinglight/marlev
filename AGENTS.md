# Editing Athena Holistic Health

## Editor experience
The editor uses chat and does not know Git. Implement requested text, image,
style, and layout changes; handle commands and Git yourself. Use plain language.
Make reasonable choices within the current design. Ask only for material missing
information. End with what changed, what was checked, and how to view it.

## Help and available operations
When the user asks what they can do, asks for allowed operations, commands, or
instructions, or asks for a list of requests, answer with this concise menu in
plain language. Explain that these are examples, not exact required commands:

| Example request | Action |
| --- | --- |
| "Change this text..." | Edit page text and prepare it for review. |
| "Change the layout/colors/button..." | Adjust the design and check desktop/mobile views. |
| "Replace this image..." | Update an image and its alt description. |
| "Update the address/contact details..." | Update affected pages and location links consistently. |
| "Show me a preview" | Provide a verified remote preview, or a local preview if unavailable. |
| "What changed?" / "What changes?" | Summarize the current edits and checks. |
| "Publish these changes" | Merge the reviewed changes into master and verify deployment. |
| "Undo the last published change" | Revert that change through the publishing workflow. |

Editing prepares a preview; only an explicit publish request makes changes live.
For a standalone "What changed?", summarize the actual current changes and append
the menu. For an actual publish request, perform the publishing workflow; do not
respond only with a menu. Quoted command examples in a help request do not grant
publication authorization. When asked about an operation outside this menu, explain
whether it is possible and any material missing information or permission.

## Site map and commands
- Seven root HTML pages, shared `styles.css`, assets in `images/`.
- `index.html` is the English home page; `russian.html` is the Russian home page.
- Static HTML/CSS; Node 22/npm 10 run tooling. No frontend framework required.
- Check/build: `npm run build`, `npm run check:baseline`, and `git diff --check`.
- Install: `npm ci`. Wrangler is pinned in package-lock.json.
- Local preview: `npm run preview:site` (127.0.0.1:8787, watches HTML/CSS/images).
- `./serve.sh` remains a legacy Python fallback; prefer Wrangler.
- Repository: https://github.com/countinglight/marlev
- Production: https://www.marlev.com/ (confirm the configured domaster before publishing).
- Existing production hosting is Cloudflare Pages. GitHub default is now `master`;
  Pages production-branch alignment must be verified in Cloudflare before publishing.
- Pages previews are confirmed: retrieve exact URLs from the Cloudflare check-run
  output.summary for the commit. Never guess a preview URL.
- `wrangler.site.jsonc` targets only the new `marlev-site-preview` test Worker,
  serving generated `dist/`, with no production custom domains. `npm run deploy:test`
  requires Cloudflare login and is authorized only for that test target.

## Temporary migration hold
The owner approved Node/Wrangler preparation on `vlads-dev`, based on `master`.
A parallel HTML/CSS edit outside Git is expected in a few days. Until it arrives:
- Do not edit, rename, or move HTML/CSS, or change public paths without new direction.
- Preserve migration/content-baseline.json and its base commit for comparison.
- The build copies public files into ignored dist/; never serve the repo root in Wrangler.
- Do not merge migration work into master, move production domains, or replace Pages.
After receiving the external folder, compare/import its HTML/CSS at their current
paths, review against the baseline, then perform the site/ move as a separate commit.
Follow migration/README.md. Future browser apps belong under apps/<name>/ with
separate dependencies/builds; publish only their generated output, never source.

## Editing and verification
Keep changes focused. Preserve unrelated work. Keep repeated headers, navigation,
and footers consistent across affected pages, including correct active links.
Preserve language switching and the intentional differences in Russian navigation.
For shared facts such as contact details, update English and Russian occurrences;
for substantive translated prose, confirm intended translation scope when unclear.
Use existing CSS patterns, semantic markup, useful image alt text, and responsive
images. Avoid introducing dependencies or frameworks for routine editing.
Run both checks above. For visual changes, inspect affected pages at desktop and
mobile widths in an available browser, including navigation, links, and overflow.
If browser access is unavailable, say visual inspection remasters unverified.
The checker is a structural smoke check, not a full HTML validator or browser test.
Do not change medical claims or business facts beyond the editor's request.

## Git, review, and publishing
1. Inspect status, branch, remote, and diff before editing. Fetch origin when
   authenticated access is available. Base new work on current origin/master in a
   clean checkout; never discard, stash, or overwrite another person's work.
2. Use a task branch such as `edit/homepage-intro`, never edit directly on master.
   Resume the existing task branch when appropriate. Keep one editing task active
   in a checkout; use separate worktrees for concurrent tasks.
3. Editing requests authorize local edits, relevant checks, focused commits,
   pushing the task branch, and creating/updating a pull request. Do not repeatedly
   ask permission for these routine steps, subject to harness permissions.
4. Stage explicit relevant files; inspect the staged diff before committing.
   Never force-push, reset destructively, or commit credentials.
5. Share the verified Cloudflare branch preview if available; otherwise start a
   local preview and explain that it is local to this computer. Give a short list
   of changes and any verification gaps. Keep the branch unpublished to production.
6. Only an explicit request to publish/go live authorizes merging into master.
   Before merging, verify the latest branch checks, review the complete PR diff,
   and ensure it matches the reviewed preview. Resolve master updates on the task
   branch and repeat affected checks/review if the visible result changes.
7. Prefer `gh pr create` and `gh pr merge --squash --delete-branch`. Wait for the
   actual checks; do not bypass failures or protection. If GitHub authentication
   fails, retain all work locally and explain the one-time login needed.
8. After merge, verify Cloudflare deployment status via available authorized
   integration/checks and inspect the affected live pages for the actual change.
   A GitHub merge or HTTP 200 alone does not prove deployment. If status cannot
   be observed, report publication as unverified rather than claiming success.
9. Undo published work with a focused revert through this same workflow; never
   rewrite master history. A request to undo live work authorizes that publication.

## Boundaries and known gaps
Branch protection is intentionally deferred; do not configure it without request.
Ask before changing deployment, domasters, credentials, dependencies, or architecture.
Do not assume repository instructions grant tool permissions or authentication.
The contact form still uses Formspree `YOUR_FORM_ID`; it is not operational.
Three article links (`#vitamins`, `#flu`, `#fever`) also lack destination content
and are explicitly reported as known warnings. New broken references fail checks.
Warn when relevant; do not invent an endpoint, submit test messages, or silently
replace the form service. External links and form delivery need separate checks.
