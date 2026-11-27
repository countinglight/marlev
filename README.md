# Athena Holistic Health website

Static HTML/CSS website for Athena Holistic Health. Source repository:
https://github.com/countinglight/marlev.

Cloudflare hosts the site as a Worker and automatically deploys GitHub `main`.
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

The agent merges the reviewed change into `main`, triggering Cloudflare. It should
confirm the deployed result or explicitly say what it could not verify. To undo:

> Undo the last published change.

The agent uses a revert, preserving history. Keep one editing chat active per
checkout. Concurrent edits require separate checkouts/worktrees.

## Local preview and checks

Python 3 is the only local requirement:

```sh
./serve.sh
python3 scripts/check_site.py
git diff --check
```

Preview: http://127.0.0.1:8000. Stop with Ctrl+C. To choose a different port:
`./serve.sh 8001`. The server binds only to this computer and serves the repository
regardless of which directory the command is launched from. Do not expose this
repository server to the internet; it also contains development files.

The dependency-free checker validates local HTML links and fragments, image and
stylesheet references (including CSS URLs), duplicate IDs, basic document metadata,
and image alt attributes. It reports the known placeholder form and three existing missing article
fragments (`vitamins`, `flu`, `fever`) as warnings. All other missing local
references fail the check.
It does not validate all HTML/CSS syntax, check external websites or form delivery,
or replace browser inspection. Inspect visual edits at desktop and mobile widths.
The GitHub Actions `Site checks` workflow runs the same structural check on pull
requests and pushes to `main`; it does not deploy or protect the branch.

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
3. In the existing Worker's Cloudflare dashboard, confirm the GitHub repository,
   `main` production branch, live domain, and deployment status visibility.
   Enable/configure branch previews if desired; they are not established by these
   repository files. Do not change working production settings just to add previews.
4. Until remote previews are configured, review locally on the editor's computer.
   With remote previews, ensure the agent can retrieve their real URLs from build
   output, deployment checks, PR comments, or an authorized integration.
5. Exercise an edit, preview, publish, and revert before handing over. Later,
   protect `main` and require `Site checks / check` once the workflow has run.

Publishing merges the PR using authenticated `gh`; Cloudflare performs deployment.
The editor's machine does not need a Cloudflare deployment token for this flow.
Without branch protection, the instruction to wait for “publish” is a behavioral
rule, not an enforced access boundary.

## Known limitations

- `contact.html` contains Formspree `YOUR_FORM_ID`. The form is not operational;
  the displayed email and phone links remain available. The owner must supply
  a real endpoint before form delivery can be configured and tested.
- Remote branch previews, production domain, and Cloudflare status access must
  be confirmed in the dashboard. The expected public domain is www.marlev.com.
- Three article cards link to absent sections (`#vitamins`, `#flu`, `#fever`).
  Their missing content needs an editorial decision; it has not been invented.
- External links, embedded maps, and third-party services are not checked offline.
- The empty legacy `CNAME` file is not evidence of the current hosting setup.

## Maintainer notes

Keep `AGENTS.md` current when commands or deployment procedures change. Keep
reusable automation in scripts. A custom skill can be added later if a longer
repeatable workflow develops; none is required for routine text/layout editing.
