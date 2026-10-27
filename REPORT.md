# HNL Dev v0.3.1 – Preview Studio Root Cause & Regression Report

Date: 2026-10-27 (Asia/Ho_Chi_Minh)
Source baseline: GitHub `lengochieu1211-sudo/hnl-dev-center` main `5ae74245685480d1f89660db51b698428c00481a` (v0.3.0), exact local file blobs verified.
Target: HNL Dev Center only. QLTC/HCF/HCE source, data, GitHub, Firebase, R2 untouched.

## Symptoms and root causes
1. Vercel project `hnl-dev-center` currently has **SSO protection enabled** (`all_except_custom_domains`). Unauthenticated mobile browsers may need a Vercel login or a time-limited share link. No change to access protections in this patch.
2. `Preview Studio` uses a cross-origin iframe with an opaque sandbox origin (`allow-scripts allow-forms`). Firebase Auth/localStorage and target site X-Frame-Options/CSP may prevent rendering; no iframe can reliably override target authorization or anti-framing policies.
3. Desktop selected 1920 px viewport was formerly rendered at the scaled iframe element width (e.g. 280 px on phone) instead of a true 1920 px browser viewport.
4. 'Open in new tab' fallback was outside preview and easily missed on mobile if the iframe appeared blank.

## Changes
- Make embedded iframe keep the requested logical viewport (1920/1366/820/393/360 pixels) using transform scale.
- Always display a persistent **Open Web in new tab** fallback bar inside the preview viewport and an external link under URL controls.
- Keep iframe sandboxed without `allow-same-origin`, do not claim the target successfully loaded, and continue allowlisting HTTPS on web.app/firebaseapp.com/vercel.app.
- Use title **HNL Dev** (shortened) across shell/browser/PWA label; bump version and service worker cache v0.3.1.
- Add regression tests for correct embed viewport, fallback link, safe sandbox. No external AI API.

## Files changed/new versus v0.3.0
- package-lock.json
- package.json
- scripts/build.mjs
- src/sw.js
- src/index.html
- src/styles.css
- src/app.ts
- src/manifest.webmanifest
- tests/preview-browser.py
- tests/preview.test.mjs

## Test gates
- npm run typecheck: PASS.
- npm run lint: PASS (project's static safety lint; no ESLint configuration).
- npm test: 7/7 PASS.
- npm run audit:public: PASS, 29 source files checked.
- npm run build: PASS.
- tests/browser-smoke.py: 7/7 viewport configurations PASS.
- tests/preview-browser.py: 5/5 viewport configurations PASS; checks real logical iframe width, fallback URL, no horizontal overflow.
- package.json / package-lock.json: version synchronized.
- ZIP CRC / manifest / SHA256: checked when packaged.
- Firebase config: not present in HNL Dev Center project and not changed.
- GitHub workflows: unchanged from v0.3.0; CI on new branch must be checked separately after push.

## Known limitations
- Cross-origin iframe preview remains optional/best effort; real logged-in Firebase/Google web apps should be opened in their own browser tab.
- Vercel SSO remains enabled; share links expire and the user may need to authenticate.
- Chromium DOM tests are NOT real iPhone Safari / physical Android / AutoCAD Runtime Golden.
- HNL Dev stores work locally in each browser and is not multi-device synced.
- No changes to any PROD system.

## Certification
DEV Candidate; do not label CERTIFIED until hosted runtime and mobile device Golden are confirmed.