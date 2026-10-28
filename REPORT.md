# HNL Dev v0.4.0 — AUDIT & TEST REPORT

## Source lock
- Repository: `lengochieu1211-sudo/hnl-dev-center` (Public)
- Branch: `dev`
- Verified base exact HEAD: `de529cf5ba0818b82ea3e6ae9c718fd38bacdffe`.
- Base: `HNL-DEV-v0.3.3-FULL-SOURCE.zip` previously delivered & backed up. Source ZIP has extra terminal newline in some text compared to GitHub blobs; sampled content matches GitHub when removing trailing newline. No rollback.
- Status new release: **LOCAL DEV CANDIDATE — NOT PUSHED / NOT DEPLOYED**; GitHub `main` and live Vercel v0.3.3 untouched.

## Root cause and scope
The old dashboard merely showed CI/HEAD but did not expose actual build deliverables (ZIP, EXE/APK packages inside artifacts) or GitHub Issues. Mobile work stayed in localStorage and was not GitHub work. The user needed real workflows without additional paid AI APIs.

## Minimal solution
- `src/app.ts` + `src/index.html` + `src/styles.css`: Add read-only GitHub artifact list and Issues list; re-fetch exact branch HEAD before listing, filter runs by SHA and GitHub origin, filter artifact by run ID and SHA. Show sizes, expiration and trusted workflow pages. Prevent DEV BACKUP from inheriting unknown HEAD. Issues listing filters Pull Requests and uses textContent against injection. API rate-limit and errors are displayed as unknown, not PASS.
- Version bump and PWA cache key `0.4.0`; npm lock matches package. Existing local tasks, schema, Preview, QLTC environments preserved.
- GitHub API documented endpoints are public read: `GET /git/ref/heads`, `/actions/runs`, `/actions/runs/{id}/artifacts`, `/issues`; never calls POST/PUT/PATCH/DELETE. Download requires GitHub login in many contexts, so UI opens the verified Actions run rather than promising immediate anonymous ZIP download.

## Regression and safety
- TypeScript `tsc --noEmit`; static security lint, `npm ci`, package-lock; Node `npm test`; build `npm run build`.
- Chromium: 7 viewport existing UI smoke; 4 viewport QLTC env; 3 viewport new GitHub modules with mocked results. Tests cover SHA mismatch, expired artifact, PR exclusion, mobile overflow, unknown DEV BACKUP SHA and DOM injection.
- Firebase: no Firebase config or Rules within HNL Dev; no change to any Firebase project, Rules, Hosting or R2. This is not a QLTC Firestore/Rules runtime test.
- GitHub workflow: unchanged existing CI; no deployment commands added; source public-safety scan. `.gitignore` excludes generated test screenshots/JSON.

## Local verification results — 27/10/2026
- `npm ci --offline --ignore-scripts`: PASS (no runtime dependencies).
- TypeScript: PASS. Static lint: PASS (not ESLint).
- Node unit: **15/15 PASS**.
- `npm run build`: PASS. `npm run audit:public`: PASS.
- Chromium browser mock: **7/7** existing UI sizes, **4/4** QLTC environment sizes, **3/3** new GitHub module sizes PASS.
- Live GitHub API contract sampled read-only: HCF run `40420766842` returns two nonexpired artifacts with matching workflow run SHA; QLTC Issues API includes PR items which must be excluded.

## Remaining risk
- GitHub public API quota / network / permissions; artifact download after opening GitHub may require login or have expired.
- Build run listing is capped to first 100, shows max 12; absence not proof that no other run exists.
- HCF/HCE share CAD repository so Issues not separated automatically.
- The Web does not run EXE/APK/AutoCAD, and does not operate OpenCode/Antigravity automatically.
- No real-browser API authentication, device Runtime Golden, real GitHub Actions CI for v0.4.0, or full multi-user runtime audit yet; no CERTIFIED.