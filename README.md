# Athena Holistic Health website

Static HTML/CSS website for Athena Holistic Health. Source repository:
https://github.com/countinglight/marlev.

Cloudflare Pages currently hosts the production site at
https://marlev.countinglight.com/ (also https://marlev.pages.dev/). GitHub’s default
branch and the verified Pages production branch are both `master`. Workers is
the agreed target for this website and future browser apps; Pages stays in place
only until the external content import and planned cutover.
There is no build step or dependency installation for the site itself. This
repository does not contain the Cloudflare dashboard configuration; keep the
existing deployment settings. Branch protection is intentionally deferred.

## Editing through chat

Open this repository in Codex or Claude Code. `AGENTS.md` defines the shared
workflow; `CLAUDE.md` imports it for Claude Code.

Tell the agent what you want, for example:

> Make the home page introduction shorter and make the contact button more visible.

The agent edits on a branch, checks the site, commits, and provides a preview.
Ask for adjustments in the same chat. When satisfied, say:

> Publish these changes.

The agent merges the reviewed change into `master`, triggering Cloudflare. It should
confirm the deployed result or explicitly say what it could not verify. To undo:

> Undo the last published change.

The agent uses a revert, preserving history. Keep one editing chat active per
checkout. Concurrent edits require separate checkouts/worktrees.

## Node/Wrangler preview and checks

The migration tooling is on `vlads-dev`. Public HTML/CSS stays at its existing
paths until the external editing pass is imported. See [migration plan](migration/README.md).

Use Node 22 (pinned in `.nvmrc`), npm 10, and Python 3 for the existing checker:

```sh
npm ci
npm run build
npm run check:baseline
npm run preview:site
```

Open http://127.0.0.1:8787. The preview watches source HTML/CSS/images, copies
public assets into ignored `dist/`, and serves them through Cloudflare’s local
Wrangler runtime with live reload. No Cloudflare login is needed locally.
Ctrl+C stops it. Use `npm run preview:site -- --port 8788` for another port. Generated output is disposable; edit the source files, not dist/.
`npm run preview:built` serves an existing build without the source watcher.
`./serve.sh` remains the legacy Python fallback on port 8000.

The build validates local links, fragments, image/stylesheet references, duplicate
IDs, metadata, and image alt attributes using the existing Python checker. Four
existing warnings remain: the placeholder contact form and three missing article
fragments. It does not replace browser inspection or test third-party services.
`check:baseline` verifies the temporary HTML/CSS freeze; update that manifest only
after reviewing the external edits. CI runs both checks for PRs and pushes to
`master` and `vlads-dev` once this workflow is present on those branches.

For the separate test Worker only:

```sh
npx wrangler login
npm run deploy:test
```

`wrangler.site.jsonc` names `marlev-site-preview`, publishes only `dist/`, and
contains no production routes/domains. This command does not migrate production.
The test Worker has been created and verified at
https://marlev-site-preview.vlad-sadovsky.workers.dev/. It is deployed manually
from the branch; Git-connected Worker builds are a later configuration step.
Continue normal publication through GitHub and Pages
until the migration is reviewed and cut over.

## Site files

| File | Purpose |
| --- | --- |
| `index.html` | English home page |
| `russian.html` | Russian home page |
| `about-homeopathy.html` | About homeopathy |
| `acute-conditions.html` | Acute conditions |
| `articles.html` | Articles and resources |
| `contact.html` | Contact information and form |
| `directions.html` | Office directions and map |
| `styles.css` | Shared styles and color variables |
| `images/` | Existing photographs and illustrations |

Headers, navigation, and footers are repeated in HTML; shared changes must be
applied consistently. The Russian page has intentionally different navigation.

## One-time owner setup

1. On the editor's computer, open her own clone in the chosen agent and install
   Python 3, Git, and GitHub CLI (`gh`). Authenticate her own GitHub account with
   repository access: `gh auth login`, then `gh auth setup-git`. Check with
   `gh auth status` and `git fetch origin`. Do not store tokens in this repository.
2. Configure the harness to permit routine checks, branch commits/pushes, and PR
   management under your preferred permission policy. Instructions do not override
   the harness sandbox or account permissions. There is no need for a Git plugin.
3. In the existing Pages project’s Cloudflare dashboard, confirm the GitHub repository,
   `master` production branch, live domain, and deployment status visibility.
   Pages previews already work. Retrieve their exact links from the Cloudflare
   GitHub check output.summary; do not guess them.
4. Use the Node/Wrangler preview locally or the exact Pages preview reported
   for the branch commit. Keep migration publication separate from content review.
5. Exercise an edit, preview, publish, and revert before handing over. Later,
   protect `master` and require `Site checks / check` once the workflow has run.

Publishing merges the PR using authenticated `gh`; Cloudflare performs deployment.
The editor's machine does not need a Cloudflare deployment token for this flow.
Without branch protection, the instruction to wait for “publish” is a behavioral
rule, not an enforced access boundary.

## Known limitations

- `contact.html` contains Formspree `YOUR_FORM_ID`. The form is not operational;
  the displayed email and phone links remain available. The owner must supply
  a real endpoint before form delivery can be configured and tested.
- Pages previews and production branch `master` are confirmed. Its configured
  domain is marlev.countinglight.com; www.marlev.com is not attached to this
  Pages project, so its DNS/hosting must be reviewed separately before any cutover.
- Three article cards link to absent sections (`#vitamins`, `#flu`, `#fever`).
  Their missing content needs an editorial decision; it has not been invented.
- External links, embedded maps, and third-party services are not checked offline.
- The empty legacy `CNAME` file is not evidence of the current hosting setup.

## Maintainer notes

Keep `AGENTS.md` current when commands or deployment procedures change. Keep
reusable automation in scripts. A custom skill can be added later if a longer
repeatable workflow develops; none is required for routine text/layout editing.
