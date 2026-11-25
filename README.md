# Franko Trading Enterprise — E-Commerce Storefront

[![React 19](https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=000)](https://react.dev/)
[![Vite 6](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=fff)](https://vitejs.dev/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.8-764ABC?logo=redux&logoColor=fff)](https://redux-toolkit.js.org/)
[![Tailwind CSS 3](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com/)
[![Node Test Runner](https://img.shields.io/badge/Tests-node%3Atest-339933?logo=node.js&logoColor=fff)](https://nodejs.org/api/test.html)
[![Live Storefront](https://img.shields.io/badge/Live-frankotrading.com-16a34a)](https://www.frankotrading.com)

Production retail e-commerce web application and B2B agent portal for **Franko Trading Enterprise** ([frankotrading.com](https://www.frankotrading.com)), one of Ghana's largest consumer electronics retailers (smartphones, laptops, refrigerators, televisions, air conditioners, appliances, and accessories).

Built as a performance-focused React 19 + Vite 6 single-page application featuring a **Ghana Mobile Money (MTN MoMo / Telecel Cash / AT Money) checkout state machine**, a **deterministic SEO slug & 301-redirect build pipeline**, **request-deduplicated client caching**, a **role-protected sales agent portal**, and **`.env`-free production deployments**.

---

## Engineering Highlights

- **Deterministic SEO & Zero-Flash Routing (`397` indexed URLs, `381` 301 redirects):** Replaced legacy `/product/<uuid>` URLs with human-readable `/product/<slug>` routes backed by a checked-in route index (`src/utils/productRouteIndex.mjs`) so product detail pages resolve slugs to UUIDs instantaneously without fetching the full catalogue first.
- **Ghana Mobile Money Checkout Invariants:** Built a pure-function payment & order state module (`src/utils/checkoutFlow.mjs`) with automatic `+233` / local telecom prefix detection (`MTN`, `Telecel`, `AirtelTigo`), resilient gateway response-body parsing (preventing provisional USSD prompt codes from prematurely cancelling active prompts), and strict separation between confirmed mobile-money payments and offline/agent orders.
- **Perceived-Performance & Caching Layer:** Combines route-level `React.lazy` code-splitting, below-the-fold `DeferredSection` hydration, `requestIdleCallback`/hover preloading of `ProductDescription`, in-flight request deduplication (`src/utils/readCache.mjs`), mutation-triggered Redux cache invalidation (`src/Redux/store.js`), and instant product-memory handoff (`src/utils/productMemory.mjs`) while always fetching live pricing.
- **Crash-Resistant Client Persistence:** Custom encrypted storage adapter (`src/utils/appStorage.mjs`) that safely migrates legacy plaintext or double-encrypted payloads and discards corrupted ciphertexts per key without patching global `localStorage` or breaking cart/session state.
- **`.env`-Free Production Deployment Architecture:** Production builds (`npm run build`) intentionally disable `.env` file loading (`envDir: false` in `vite.config.js`), enforce `.env` exclusion across Git/Docker/Vercel ignore rules, and verify via `postbuild` (`scripts/verify-no-env.mjs`) that zero `.env` files ever enter `public/` or `dist/`.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Browser (React 19 + Vite 6 SPA)                      │
│                                                                             │
│  ┌──────────────────────┐   ┌───────────────────────┐   ┌────────────────┐ │
│  │ Storefront Routes    │   │ B2B Agent Portal      │   │ Campaign Flows │ │
│  │ Home, Categories,    │   │ /agent/dashboard      │   │ /telecel-*     │ │
│  │ ProductDescription,  │   │ /agent/orders         │   │ /speed, /combo │ │
│  │ Checkout, Wishlist   │   │ /agent/ctp001-products│   │ /clearance     │ │
│  └──────────┬───────────┘   └───────────┬───────────┘   └───────┬────────┘ │
│             └───────────────────────────┼───────────────────────┘          │
│                                         ▼                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ State, Caching & Storage Layer                                        │ │
│  │ • Redux Toolkit (13 slices) + redux-persist + autoLogoutMiddleware    │ │
│  │ • In-memory readCache (TTL + in-flight dedupe + mutation invalidation)│ │
│  │ • productRouteIndex (381 slug↔UUID entries) + productMemory handoff   │ │
│  │ • appStorage (AES encryption with legacy plaintext fallback)          │ │
│  └──────────────────┬───────────────────────────────────┬────────────────┘ │
└─────────────────────┼───────────────────────────────────┼──────────────────┘
                      │                                   │
         ┌────────────▼────────────┐         ┌────────────▼────────────┐
         │ Storefront Lambda API   │         │ Product & Media CMS API │
         │ (Catalogue, Cart, Auth, │         │ (CTP001/CTP002 Brands,  │
         │  Orders, MoMo Payments) │         │  Categories & Media)    │
         └─────────────────────────┘         └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│               Build-Time SEO & Deployment Verification Pipeline             │
│  seo/data/products-YYYY-MM-DD-full.csv                                      │
│    └─► scripts/import-seo-products.py  ──► seo/data/products.json (381)     │
│                                        ──► product-sitemap-only.json (1)    │
│    └─► generate-sitemap.js (postbuild) ──► public/ & dist/sitemap.xml (397) │
│                                        ──► _redirects & nginx 301s (381)    │
│    └─► scripts/verify-no-env.mjs       ──► blocks any .env in deploy output │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Deep Dive: Notable Subsystems

| Subsystem | Key Files | What It Solves |
| --- | --- | --- |
| **SEO Slug & Redirect Pipeline** | `Franko_web/src/utils/productSlug.js`<br>`Franko_web/src/utils/productRouteIndex.mjs`<br>`Franko_web/scripts/import-seo-products.py`<br>`Franko_web/scripts/seo-artifacts.mjs`<br>`Franko_web/generate-sitemap.js` | Guarantees 1:1 agreement between client URLs, `sitemap.xml`, Netlify `_redirects`, and Nginx 301 rules. Fails fast on duplicate slug collisions and quarantines malformed UUIDs into sitemap-only output rather than fabricating broken redirects. |
| **Ghana MoMo & Checkout Flow** | `Franko_web/src/utils/checkoutFlow.mjs`<br>`Franko_web/src/utils/cartItems.mjs`<br>`Franko_web/src/Pages/CheckoutShared.jsx` | Normalizes Ghana mobile numbers (`024`/`055`/`020`/`026` etc. & `233…`), parses heterogeneous payment gateway payloads safely, enforces order payload completeness, and protects multi-item carts against single-record API responses overwriting local lines. |
| **Read Cache & Instant Navigation** | `Franko_web/src/utils/readCache.mjs`<br>`Franko_web/src/utils/productMemory.mjs`<br>`Franko_web/src/Redux/store.js`<br>`Franko_web/src/Pages/Home.jsx` | Deduplicates concurrent catalog reads (including React StrictMode double-mounts), invalidates stale slices on mutations, preloads `ProductDescription` during browser idle/hover, and keeps clicked product previews visible while live pricing loads. |
| **Safe Encrypted Persistence** | `Franko_web/src/utils/appStorage.mjs`<br>`Franko_web/src/utils/catalogueShape.mjs`<br>`Franko_web/src/utils/secureLocalStorageInit.js` | Encrypts sensitive browser keys (`customer`, auth/session state) without monkey-patching `window.localStorage`, supports seamless legacy reads, and sanitizes malformed persisted Redux slices on rehydration. |
| **B2B Sales Agent Portal** | `Franko_web/src/Pages/Agents/`<br>`Franko_web/src/Redux/Slice/ctp001Slice.js`<br>`Franko_web/src/utils/ProtectedRoute.jsx` | Dedicated role-gated workspace (`/agent/dashboard`, `/agent/orders`, `/agent/ctp001-products`) with inactivity auto-logout, CSV/Excel/PDF reporting (`xlsx`, `jspdf`, `recharts`), and CMS inventory integration. |

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Core Framework** | React 19.1, Vite 6.3, React Router 6.30 |
| **State & Persistence** | Redux Toolkit 2.8, React-Redux 9.2, Redux Persist 6, `crypto-js` |
| **UI & Styling** | Tailwind CSS 3.4, Ant Design 5, Material UI 7, Material Tailwind 2, Heroicons, Lucide React, GSAP 3, Splide |
| **Data & Networking** | Axios 1.9, Recharts 3, SheetJS (`xlsx`), jsPDF + AutoTable, Day.js |
| **SEO & Analytics** | React Helmet, Automated XML Sitemap + 301 Redirect Generator, Google Tag Manager, Meta Pixel, TikTok Pixel, Tawk.to |
| **Testing & Tooling** | Node.js built-in test runner (`node:test`), Python 3 (SEO CSV importer), ESLint 9 |

---

## Repository Structure

```text
franko_web/
├── README.md                              # Project overview & architecture guide
├── .gitignore                             # Repo-wide ignores (blocks all .env files)
├── .dockerignore / .vercelignore          # Deploy-time exclusions for .env & artifacts
└── Franko_web/                            # Main Vite + React application
    ├── index.html                         # SEO metadata, analytics tags, chat launcher
    ├── package.json                       # Scripts: dev, build, postbuild, test
    ├── vite.config.js                     # Vite config (envDir: false on build)
    ├── .env.example                       # Documented env var reference (no secrets)
    ├── generate-sitemap.js                # Post-build sitemap, _redirects & nginx generator
    ├── SITEMAP_UPDATE_2026-11-25.md       # Latest catalog sitemap changelog
    ├── SEO_MIGRATION.md                   # Slug migration & redirect architecture notes
    ├── public/
    │   ├── robots.txt                     # Crawl policy & sitemap declaration
    │   └── sitemap.xml                    # Generated XML sitemap (397 URLs)
    ├── scripts/
    │   ├── import-seo-products.py         # Spreadsheet CSV → validated JSON snapshots
    │   ├── seo-artifacts.mjs              # Pure sitemap, 301 redirect & index builder
    │   └── verify-no-env.mjs              # Post-build check blocking .env in output
    ├── seo/
    │   ├── README.md                      # Snapshot maintenance documentation
    │   └── data/                          # Versioned CSV exports & validated JSON snapshots
    └── src/
        ├── App.jsx                        # Route table, lazy pages, auth & pixel hooks
        ├── Component/                     # 37+ reusable UI components, modals & skeletons
        ├── Pages/                         # 32+ storefront, checkout, campaign & Agent pages
        ├── Redux/                         # Store, middleware & 13 domain slices
        └── utils/                         # Pure business logic + 7 node:test suites
```

---

## Local Development

### Prerequisites

- **Node.js** `>= 20` (required for native `node:test` and `AbortSignal.timeout`)
- **npm** `>= 10`
- **Python 3** (only needed when importing a new product CSV into `seo/data/`)

### Setup & Run

```bash
git clone https://github.com/Owusua22/franko_web.git
cd franko_web/Franko_web
npm ci
```

For **local development only** (`npm run dev`), copy `.env.example` to an untracked `.env` file and populate your development endpoints:

```bash
cp .env.example .env
npm run dev
```

> **Note:** `.env` is strictly gitignored and never read during production builds (`npm run build`).

---

## Deploying Without a `.env` File

This repository is explicitly configured so **every production deployment runs with zero `.env` files**:

1. **No `.env` in Git or Deploy Archives:** `.env` and `.env.*` (except `.env.example`) are blocked across `.gitignore`, `.dockerignore`, and `.vercelignore`.
2. **Production Builds Ignore `.env` on Disk:** `Franko_web/vite.config.js` sets `envDir: command === "build" ? false : process.cwd()`, guaranteeing `vite build` consumes **only** environment variables injected by your hosting platform or CI/CD runner (`process.env.VITE_*`).
3. **`.env`-Free Post-Build Pipeline:** `generate-sitemap.js` does not load `.env` files; it builds deterministically from the checked-in `seo/data/products.json` snapshot (or explicit platform `process.env` values when `SEO_SOURCE=live`).
4. **Automated Output Guardrail:** `postbuild` runs `scripts/verify-no-env.mjs` after every build and fails immediately if any `.env` file appears inside `public/` or `dist/`.

### Required Platform / CI Environment Variables

Configure these in your hosting dashboard (**Netlify → Environment variables**, **Vercel → Settings → Environment Variables**, **Cloudflare Pages**, **GitHub Actions Secrets**, or container env):

| Variable | Required | Default | Purpose |
| --- | :---: | --- | --- |
| `VITE_LAMBDA_BASE_URL` | Yes | — | Primary AWS Lambda storefront API gateway URL |
| `VITE_LAMBDA_HEADER_NAME` | No | `Identifier` | Custom API gateway header name |
| `VITE_LAMBDA_HEADER_VALUE` | No | `Franko` | Custom API gateway header value |
| `VITE_CMS_BASE_URL` | No | `https://cms.frankotrading.com` | Product/media CMS API base URL (CTP001 / CTP002) |
| `VITE_CMS_API_KEY` | Recommended | `""` | CMS API key for authorized catalogue endpoints |
| `VITE_SECRET_KEY` | Recommended | `'your-secret-key'` | Client-side storage encryption passphrase |
| `SEO_SOURCE` | No | `snapshot` | Set to `live` only if generating sitemap directly from the live API |
| `SEO_STATIC_ONLY` | No | `0` | Set to `1` for static-only preview builds without product entries |

### Production Build Command

- **Base directory:** `Franko_web`
- **Build command:** `npm run build`
- **Publish directory:** `Franko_web/dist`

```bash
cd Franko_web
npm ci
npm run build
```

`npm run build` runs:
1. `vite build` (with `envDir: false`, bundling injected `process.env.VITE_*` values)
2. `node generate-sitemap.js` (writes `sitemap.xml`, `_redirects`, `seo-index.json` into both `public/` and `dist/`, plus `seo-redirects.nginx.conf`)
3. `node scripts/verify-no-env.mjs` (verifies zero `.env` files exist in `public/` or `dist/`)

For Nginx deployments, include the generated `Franko_web/seo-redirects.nginx.conf` inside your server block so legacy `/product/<uuid>` URLs issue genuine HTTP `301` redirects.

---

## Updating the Product Sitemap

When a new catalogue spreadsheet is exported:

```bash
cd Franko_web
cp /path/to/products-YYYY-MM-DD-full.csv seo/data/
python3 scripts/import-seo-products.py seo/data/products-YYYY-MM-DD-full.csv
npm run generate:sitemap
npm run build
```

Current snapshot (`2026-11-25`): **382 products** (`381` validated UUIDs + `1` sitemap-only entry) + **15 static pages** = **397 unique `<loc>` URLs** in `public/sitemap.xml` and **381 permanent 301 redirects**. See [`Franko_web/SITEMAP_UPDATE_2026-11-25.md`](Franko_web/SITEMAP_UPDATE_2026-11-25.md) and [`Franko_web/seo/README.md`](Franko_web/seo/README.md) for details.

---

## Testing

Unit tests run directly on Node's built-in test runner (`node:test`) with zero external test framework overhead:

```bash
cd Franko_web
npm test
```

Test suites in `Franko_web/src/utils/`:
- `appStorage.test.mjs` — Encrypted storage, legacy plaintext fallback, corruption recovery, Redux rehydration safety
- `cartItems.test.mjs` — Cart payload unwrapping, deduplication, multi-item merge regressions
- `checkoutFlow.test.mjs` — Ghana MoMo prefix detection, gateway outcome parsing, order dispatch validation
- `navigationCache.test.mjs` — Read cache TTL, in-flight deduplication, mutation invalidation, product memory handoff
- `productPresentation.test.mjs` — Product tag formatting & detail normalization
- `productSlug.test.mjs` — Name-only slug generation, conflict blocking, full 397-URL sitemap integrity assertions
- `pendingText.test.mjs` — UI copy hygiene check

---

## License

MIT — see [`Franko_web/package.json`](Franko_web/package.json).
