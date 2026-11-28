# Private contact form using Cloudflare Workers and Turnstile

Date: 2026-11-28

Status: Implementation specification; website changes are not implemented or published by this document.

## 1. Objective

Replace the inactive contact form with a working information, appointment, and quote request form. Remove the practice's receiving email address from every publicly served page and asset so visitors can contact the practice without exposing that address to address-harvesting bots.

Expected legitimate volume is 2–4 requests per day. Target recurring service cost is $0 using Cloudflare Workers Free, Turnstile Free, and Cloudflare email delivery to one verified destination inbox. Recheck account eligibility and current limits before implementation; do not silently enable a paid service.

Implementation code, configuration templates, tests, and operating instructions belong in this repository. Recipient addresses, sender addresses, and private credentials do not belong in Git or public assets.

## 2. Current repository and behavior

- Eight static HTML pages live in `site/`, with shared `site/styles.css` and public media. `site/index.html` and `site/russian.html` are the English and Russian home pages.
- `site/contact.html` contains a Formspree `YOUR_FORM_ID` placeholder, a setup notice, and direct email links. The form is not operational.
- Direct email links appear in seven English page footers, contact details, and the online payment instructions. Russian navigation already links to the shared contact page; audit all eight pages again during implementation.
- `wrangler.site.jsonc` currently deploys static assets from generated `dist/`, with no Worker entry point. The Worker is named `marlev-site-preview` and serves the public domain `marlev.countinglight.com`.
- `scripts/build-site.mjs` copies allowed public files from `site/` to `dist/`. Worker source must stay outside both directories.
- Node 22, npm 10, and pinned Wrangler 4.169.0 are already configured. Use the existing tooling and built-in Node test runner where possible.
- `npm run preview:site` runs local Wrangler and rebuilds assets when `site/` changes. GitHub's existing checks run `npm ci` and `npm run build`.
- Merges to `master` trigger the existing Cloudflare production workflow. Editing and previewing do not authorize publication.

## 3. Scope and exclusions

Deliver a styled, accessible contact form, a same-origin submission endpoint, server-side spam and input checks, private email delivery, focused tests, and setup/operations documentation. Remove exposed practice email links and obsolete Formspree setup instructions consistently.

Do not introduce a framework, database, file uploads, customer accounts, payment changes, email autoresponders, a submission dashboard, or a new hosting service. Keep the existing PayPal buttons and telephone links. Do not change medical claims, fees, address, hours, or existing business policies.

The form handles general inquiries, not medical intake. Include a brief request not to submit medical records, sensitive health information, or payment card details. Do not claim that the form or email delivery provides a patient portal or regulatory compliance.

Historical Git commits, old deployments, search caches, and addresses already harvested are outside this removal's scope. Do not rewrite Git history or retire old deployment infrastructure without a separate request. Document that these copies may remain discoverable.

## 4. Architecture and file ownership

```text
Browser: contact.html + contact.js + Turnstile widget
    |
    | POST /api/contact (same origin, form fields and token)
    v
Existing site Worker: worker/contact.js
    |-- request limits, origin check, field validation, honeypot
    |-- Cloudflare rate-limit binding
    |-- Turnstile Siteverify: validate token, hostname, action
    |-- Cloudflare email binding: fixed verified recipient
    v
Practice inbox; Reply addresses the visitor

Other requests -> existing static assets through ASSETS
```

Proposed files and changes:

| Path | Purpose |
| --- | --- |
| `worker/contact.js` | Worker entry point and submission handler |
| `worker/contact-validation.js` | Pure validation helpers if separation improves clarity |
| `site/contact.html` | Form markup, privacy note, widget, fallback contact method |
| `site/contact.js` | Submit handling, Turnstile lifecycle, accessible feedback |
| `site/styles.css` | Focused form, status, and responsive styling |
| Other affected `site/*.html` | Replace email links and payment email reference |
| `wrangler.site.jsonc` | Entry point, assets binding, email and rate-limit bindings |
| Preview configuration, if needed | Explicit isolated non-delivering preview mode |
| `test/contact*.test.mjs` | Validation, endpoint, and delivery failure tests |
| `scripts/check-site.mjs` | Guard against exposed addresses and obsolete form endpoints |
| `package.json`, `.github/workflows/site-checks.yml` | Run meaningful Worker checks in CI |
| `README.md` | Setup, safe local preview, operations, and limitations |

Do not edit or commit `dist/`. Do not put Worker files, private configuration, captured inquiries, or internal documentation under `site/`.

## 5. Visitor experience

Keep the existing contact page's design and contact facts. Use the heading “Send Me a Message” or an equivalent within the current design. Do not promise a specific response time unless the owner supplies one.

| Field | Required | Server limit and behavior |
| --- | --- | --- |
| Name (`name`) | Yes | Trim edges; 1–100 characters; reject line breaks and control characters |
| Email (`email`) | Yes | Trim edges; at most 254 characters; practical email syntax check; reject CR/LF and control characters |
| Phone (`phone`) | No | Trim edges; at most 50 characters; allow international formatting; reject line breaks and controls |
| Request type (`requestType`) | Yes | Allowlist: `information`, `appointment`, `quote`, `other` |
| Message (`message`) | Yes | Trim edges; 1–5,000 characters; allow ordinary Unicode and newlines; reject NUL and inappropriate control characters |
| Spam trap (`website`) | No | Must be empty; visually hidden and excluded from keyboard and assistive-technology interaction |
| Turnstile token (`cf-turnstile-response`) | Yes | Nonempty string; maximum 2,048 characters |

Use matching HTML `required`, `maxlength`, suitable input types, `autocomplete` values, and explicit labels. Native browser validation improves usability; the Worker independently validates every value. Do not restrict names or messages to ASCII.

The request type replaces the arbitrary subject field. A quote request asks for follow-up; it must not calculate fees or promise a binding quote. Phone remains optional because email is the reply channel.

Use a managed Turnstile widget with action `contact`. Its public site key may appear in HTML; the secret key must never appear there. Keep submission unavailable until a token exists. Explain if the spam check fails to load, expires, or is blocked; provide the existing phone link as an alternative. With JavaScript disabled, display a clear phone fallback rather than leaving an apparently functional form.

During submission, prevent repeat clicks, announce progress, and keep the typed values. On success, clear the form and token and announce “Thank you. Your request has been received.” This means the email service accepted the request, not that inbox delivery has been confirmed. On validation, network, rate-limit, or provider errors, retain all visitor fields, show actionable feedback, and obtain a fresh token before retrying. Do not automatically resubmit after an ambiguous network failure.

Use an accessible live status region and field error associations; move focus to an error summary when appropriate. Verify keyboard use, visible focus, long text, 320-pixel layouts, and no horizontal scrolling. Turnstile must fit the mobile layout.

## 6. Submission endpoint contract

Endpoint: `POST /api/contact`. The frontend sends `application/x-www-form-urlencoded` using `URLSearchParams`, with `Accept: application/json`. Do not use file-capable multipart parsing for this first version.

All endpoint responses are JSON with `Cache-Control: no-store`, a stable machine-readable code, and a short public message. Never echo the recipient, credentials, raw provider errors, or submitted content.

```json
{ "ok": true, "code": "accepted", "message": "Thank you. Your request has been received." }
```

Errors use `ok: false`; validation responses may include an allowlisted `fieldErrors` object containing fixed messages, never raw submitted values.

| Status | Use |
| --- | --- |
| 200 | Email service accepted the inquiry, or explicit simulated success in a clearly marked test environment |
| 400 | Invalid fields, malformed encoding, honeypot violation, or invalid/expired Turnstile token |
| 403 | Missing or disallowed Origin, or Turnstile hostname/action mismatch |
| 405 | Unsupported method; include `Allow: POST` |
| 413 | Body exceeds the byte limit |
| 415 | Unsupported content type or content encoding |
| 429 | Submission rate exceeded; include `Retry-After: 60` |
| 503 | Missing required configuration, disabled public preview delivery, or unavailable dependency |

Unknown `/api/*` paths return 404 JSON. Other paths delegate to `env.ASSETS.fetch(request)` without changing existing static routing, language links, or missing-page handling. Do not add permissive CORS headers or a GET endpoint that sends email.

## 7. Worker processing and security requirements

Process requests in this order, rejecting early:

1. Match route and method. Confirm the environment has its required configuration. Live delivery must require an explicit server-controlled enablement value.
2. Require an exact Origin match from a deployment-specific allowlist. Compare complete parsed origins, including scheme and port. Never derive trust from the incoming Host alone, use substring matching, or allow arbitrary preview subdomains. Origin checking is defense in depth, not bot authentication.
3. Require the selected form content type, UTF-8, and no unsupported compression. Read the body with an enforced 32 KiB byte ceiling. A `Content-Length` check alone is insufficient: count bytes while consuming the stream and cancel when the ceiling is exceeded, including requests without that header.
4. Apply the per-client rate limit before outbound verification or delivery. Use trusted Cloudflare `CF-Connecting-IP` in production; do not trust arbitrary forwarded-IP headers. In production, reject or fail closed if a usable client address cannot be established. Local tests supply an explicit test client identity through the test harness.
5. Parse the bounded form body. Reject duplicate expected fields, unknown fields, file-shaped values, malformed payloads, invalid types, and violated field constraints. Honeypot submissions must never reach the email service.
6. Verify the Turnstile token server-side using Siteverify, the secret, and optionally the trusted client IP. Require `success`, an explicitly allowed hostname, and action `contact`. Fail closed on timeout, malformed provider responses, or provider errors. Give Siteverify a 5-second request deadline.
7. Construct the email from validated values. Send to a single fixed server-configured recipient; the visitor cannot set To, From, CC, BCC, or arbitrary headers. Use plain text to avoid HTML injection.
8. Await the email service's documented acceptance response before returning success. Use a bounded service deadline, initially 10 seconds, with a safe timeout wrapper if the binding lacks cancellation. Do not use fire-and-forget delivery or automatic send retries.
9. Return a fixed public response. Record only a correlation ID, outcome code, duration, and sanitized dependency status; do not log the body, token, phone, email address, IP, name, or credentials.

A timeout does not prove that an email was not sent. Late provider acceptance or a lost response can result in a duplicate if the visitor retries. The initial version accepts that limitation; it must not claim exactly-once delivery. The browser prevents simultaneous submits, but that is not a server-side deduplication guarantee.

### Rate limiting

Use Cloudflare's native rate-limit binding, initially 5 submissions per 60 seconds per client IP. Verify Free-plan availability and the binding against the installed Wrangler/runtime before committing to it. Use a dedicated account-unique namespace and separate preview/production namespaces. If the binding is unavailable, stop and resolve an alternative within the $0 budget; do not quietly omit protection or use per-isolate memory as a reliable limiter.

Hash the client IP with a private salt before forming the limiter key and do not log it. Limit accepted and rejected attempts alike. These counters are approximate and local to each Cloudflare location, not a strict global quota. Distributed spam can still get through. No Durable Object, KV, database, or paid WAF rule is required by the proposed baseline.

## 8. Email delivery and private configuration

Use Cloudflare Email Sending's Workers binding to send to one verified destination address. This fits the Free-plan restriction to verified recipients. Do not send automatic replies to arbitrary visitor addresses.

- Sender: dedicated address on an onboarded sending domain, held in `CONTACT_SENDER`.
- Recipient: private `CONTACT_RECIPIENT`; never copied into source, committed Wrangler configuration, fixtures, screenshots, or public responses.
- Reply-To: validated visitor email.
- Subject: fixed site prefix plus a server-generated label mapped from the request-type allowlist.
- Body: plain-text name, reply email, optional phone, request type, message, UTC timestamp, and correlation ID. Do not include IP or Turnstile data.

Cloudflare's sending API is currently documented as beta. Check availability in this account and supported response/error behavior before implementation. Do not fall back to a paid provider without owner agreement.

Configuration inventory:

| Setting | Storage | Purpose |
| --- | --- | --- |
| Turnstile site key | Public HTML or public build setting | Renders the widget |
| `TURNSTILE_SECRET` | Cloudflare secret | Server verification |
| `CONTACT_RECIPIENT` | Cloudflare secret | Verified practice inbox |
| `CONTACT_SENDER` | Cloudflare secret | Onboarded sender address |
| `RATE_LIMIT_SALT` | Cloudflare secret | Limiter key hashing |
| `ALLOWED_ORIGINS` | Worker environment configuration | Exact permitted form origins |
| `TURNSTILE_HOSTNAMES` | Worker environment configuration | Exact expected verification hostnames |
| `CONTACT_MODE` | Worker environment configuration | Explicit `live`, `disabled`, or isolated `test` mode |
| `EMAIL` | Cloudflare email binding | Native delivery capability |
| `CONTACT_RATE_LIMITER` | Rate-limit binding | Submission abuse protection |
| `ASSETS` | Static assets binding | Existing site delivery |

Use missing/unknown mode as disabled. A browser field, URL parameter, header, or cookie must never enable live delivery or bypass verification. Test bypasses belong in injected unit-test dependencies or isolated local configuration, not publicly triggerable branches.

Local `.dev.vars*` and `.env*` files are already ignored. Provide documented variable names and placeholder values without real addresses; never commit local secret files. Do not expose secrets through a public configuration endpoint.

## 9. Cloudflare setup and deployment configuration

Before implementation rollout, confirm:

1. The correct Cloudflare account, current Worker, plan, and build integration.
2. A sending domain managed in Cloudflare DNS and available for onboarding. Do not assume ownership or DNS control of the historical practice email domain.
3. A receiving inbox and an owner who can complete its verification email.
4. A production Turnstile widget restricted to the actual public hostname, plus a separate safe testing strategy.

Prepare a concrete DNS change list before account setup. Sending onboarding can add bounce MX, SPF, DKIM, and DMARC records. Inspect existing records and preserve incoming mail routing and existing authentication policies. Do not enable incoming Email Routing or replace the current mailbox provider merely to send form notifications. Ask before applying DNS, domain, credential, deployment, or architecture changes under repository instructions; writing this specification authorizes none of those live changes.

Extend the existing `wrangler.site.jsonc`, preserving its name, custom-domain route, compatibility date unless a documented change is necessary, and current asset settings. Add `main: "worker/contact.js"`, asset binding `ASSETS`, and `run_worker_first: ["/api/*"]`. Add email and rate-limit bindings using syntax supported by the installed version. Keep real recipient restrictions out of committed binding configuration if they expose the address; enforce the fixed secret recipient in code.

Static requests should remain asset-first; only API routes require Worker-first execution. Keep documentation and server code outside the asset build. Use a Wrangler dry run to confirm packaging and bindings without deploying.

### Local and branch preview safety

Production and previews must have explicit isolated configuration. Do not assume a branch preview automatically receives different variables or secrets. Inspect the existing Cloudflare build integration and its preview behavior before choosing a named environment or separate preview config. If isolation cannot be demonstrated, keep public previews disabled for submissions.

- Local preview: use test Turnstile keys and an injected/local email sink; no real or remote email binding. Never write realistic inquiries to tracked files or logs.
- Public branch preview: disable delivery by default and show an accurate preview notice. Do not simulate real acceptance without clearly labeling it as simulated. A disabled endpoint returns 503 with a preview-specific fixed message.
- Automated endpoint tests: mock both Siteverify and email; assert no real requests occur.
- Production: explicitly enable live mode only after prerequisites and publication approval. Require production hostnames and real secret keys; reject known Turnstile test keys in live mode.

If an approved owner-assisted delivery check is later required, define its recipient, benign message, and timing separately. Current repository instructions prohibit submitting contact or payment forms during testing; implementation tests and visual review must remain mocked unless the owner explicitly overrides that restriction. Until a real receipt is observed, report inbox delivery as unverified.

## 10. Remove exposed email references

Audit every page and all served assets, not only visible text. Remove practice addresses from `mailto:` links, plain text, HTML comments, data attributes, structured data, inline scripts, and other representations introduced by the work. Do not obfuscate an address with entities, JavaScript concatenation, Base64, or an image.

- The seven English footers already contain a Contact Form link. Remove redundant Email Me links instead of creating two identical destinations. Keep repeated footer structure consistent.
- Replace the contact page's email section with a link to `contact.html#contactForm` or an equivalent valid form anchor; update existing-patient scheduling references consistently.
- On the payment page, remove the alternative instruction to send funds directly to the practice email. Retain the existing PayPal button and relevant button instructions. Do not alter the button's merchant configuration or submit it.
- The PayPal service sender address is a third-party reference, not the practice inbox. Remove its unnecessary literal address while retaining the statement that PayPal sends a confirmation, so the public-page audit can enforce no literal email addresses without an exception.
- Preserve the Russian navigation and language switching. Audit Russian content for private addresses; do not translate substantive page copy as part of this task without confirming scope.
- Remove the Formspree placeholder, activation instructions, and email fallback from the form. Keep the phone fallback.

Add a check for `mailto:` and literal email addresses in served text assets, including the built output. Do not accidentally flag ordinary CSS `@media`, the visitor email input, or the API's field name. Use synthetic addresses only in tests outside public assets. The structural checker must explicitly recognize the local Worker form action instead of treating `/api/contact` as a missing static file.

## 11. Tests and acceptance checks

Use the built-in Node test runner, dependency injection, and mocked email/verification services. Add a dedicated test command and run it in GitHub CI alongside the existing build. Do not add dependencies solely for trivial assertions.

Required meaningful cases:

| Area | Cases and expected result |
| --- | --- |
| Routing | Static pages/assets delegate unchanged; unknown API route is 404; GET cannot send; method rejection includes Allow |
| Origins | Exact valid origin accepted; absent, `null`, lookalike, foreign, and wrong-port origins rejected |
| Body limits | Over-limit body with and without Content-Length rejected before parsing; unsupported format/encoding rejected |
| Validation | Required fields, boundaries, Unicode, optional phone, invalid email, CR/LF injection, duplicate/unknown fields, and honeypot |
| Rate limiting | Exhausted limit returns 429 and Retry-After; no subsequent verification or email calls |
| Turnstile | Missing/expired/invalid token, false success, wrong hostname/action, timeout, malformed JSON, and provider failure never send |
| Delivery | Fixed sender/recipient, allowlisted subject, correct Reply-To, plain text; rejection/timeout does not return success; no automatic resend |
| Configuration | Missing secrets, missing binding, disabled mode, production test keys, and public preview cannot deliver |
| Privacy | Public responses/logs omit submitted content and secrets; source and built pages contain no email addresses or mailto links |
| Frontend | Pending state blocks double click; failures preserve fields; success resets; expired tokens refresh; blocked JS/widget has phone fallback |

Run `npm run build`, the new Worker tests, `git diff --check`, and a Wrangler dry run. Verify public output includes `dist/contact.js` copied from `site/contact.js` but excludes `worker/`, `doc/`, tests, secrets, and private configuration. Retain the existing three known article-fragment warnings; new broken references fail.

Inspect the contact page and affected shared footers at desktop and mobile widths in an available browser. Check keyboard navigation, status announcements, form anchor links, language links, PayPal link continuity, phone fallback, long messages, and overflow. Browser automation must mock submission responses; do not submit real inquiries or payment forms.

Acceptance requires all of the following:

- Functional code and safe configuration are reviewable in a focused PR.
- General inquiries can pass the mocked end-to-end validation/delivery flow; rejected cases never call email.
- No practice inbox, literal email address, or mailto link exists in current served text assets.
- Invalid configuration and public previews fail closed; secrets are absent from Git and the public build.
- Build, tests, packaging, desktop/mobile review, and changed-link checks pass or any specific unverified items are reported.
- No paid subscription or new recurring charge has been enabled.
- Production remains unchanged until an explicit publish request.
- After authorized publication, affected live pages are checked for the actual form and email removal. Email acceptance and observed inbox delivery are reported separately.

## 12. Implementation sequence and publishing

1. Inspect status, branch, remotes, and diff; fetch when authenticated. Preserve unrelated work and start a task branch from current `origin/master`.
2. Confirm account capabilities, sender-domain choice, inbox verification, preview isolation, and exact setup changes. Prepare the code and reviewable setup plan before requesting any required approval.
3. Implement Worker validation/delivery with mocks, form experience, page cleanup, and public-output guard. Preserve existing tooling and unrelated content.
4. Implement isolated safe preview configuration, focused tests, CI checks, and operating instructions.
5. Run checks, inspect desktop/mobile, inspect the complete diff and explicit staged files, commit, push, and create/update a PR. Share an exact verified Cloudflare branch preview URL from successful build logs; otherwise offer a local preview clearly described as local to this computer.
6. Apply separately approved account/DNS/secret configuration. Do not include secrets in PR text, logs, screenshots, or terminal output.
7. Only on an explicit publish request: verify latest checks and complete PR diff, resolve master updates, and merge through the existing PR-to-master workflow. Do not bypass failed checks or deploy directly as a shortcut.
8. Observe the actual Cloudflare deployment and inspect the live contact page, affected footers, payment instructions, and public assets. If deployment status or real inbox delivery cannot be observed, state exactly which result remains unverified.

This specification itself is a documentation-only change and does not authorize implementation, production deployment, DNS edits, or test messages.

## 13. Operations, limitations, and rollback

An operator should know how to disable form delivery, rotate the Turnstile secret, change and verify the recipient privately, review sanitized error outcomes, and find Cloudflare email delivery/bounce events where available. Any configuration change follows the same approval boundaries as setup. Do not promise monitoring, durable storage, or replay unless separately implemented.

There is no application database or durable queue. Provider failure returns an error to the visitor and preserves their text for manual retry. Acceptance can still be followed by a bounce or spam-folder placement. Messages reside in the email service and receiving mailbox according to their retention settings; “no database” is not “no storage.”

Free-tier limits and service availability can change. Turnstile and local approximate rate limiting reduce abuse but do not guarantee zero spam. A distributed attack can exhaust Worker capacity; keep static assets served independently. Use sanitized aggregate signals to decide whether stronger protection is necessary before adding infrastructure.

Rollback uses a focused revert PR and the normal publishing workflow, never a history rewrite. Prefer disabling the failing form and keeping the phone fallback and email removal. A wholesale revert could re-expose the inbox; explicitly review that consequence before choosing it. If restoration of email delivery requires a service or architecture change, request it separately.

## 14. Reference documentation

Official Cloudflare documentation checked on 2026-11-28; verify again at implementation time:

- [Workers static asset bindings and route selection](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Workers Free-plan limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/)
- [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Worker rate-limit binding and approximate counters](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Free email delivery to verified destination addresses](https://developers.cloudflare.com/email-service/configuration/destination-addresses/)
- [Sending-domain setup and Workers email binding](https://developers.cloudflare.com/email-service/get-started/send-emails/)
- [Email recipients and Reply-To](https://developers.cloudflare.com/email-service/examples/email-sending/recipients/)
