# Franko Trading Enterprise — Storefront App (`Franko_web`)

Frontend application package for **[frankotrading.com](https://www.frankotrading.com)** (React 19, Vite 6, Redux Toolkit, Tailwind CSS 3).

For the full project overview, system architecture, engineering deep dives, and deployment instructions, see the [root `README.md`](../README.md).

## Quick Commands

```bash
# Install exact lockfile dependencies
npm ci

# Local development (optionally create an untracked .env from .env.example)
npm run dev

# Production build (never reads .env files; uses platform/CI process.env)
# Automatically runs generate-sitemap.js + verify-no-env.mjs in postbuild
npm run build

# Regenerate sitemap.xml, _redirects, seo-index.json & seo-redirects.nginx.conf
npm run generate:sitemap

# Verify no .env files exist in public/ or dist/
npm run verify:no-env

# Run unit tests (node:test)
npm test
```

## Key Documentation

- [`../README.md`](../README.md) — Architecture, engineering highlights, and `.env`-free deployment guide
- [`./.env.example`](./.env.example) — Reference list of `VITE_*` and `SEO_*` environment variables
- [`./seo/README.md`](./seo/README.md) — Product snapshot import & sitemap refresh workflow
- [`./SITEMAP_UPDATE_2026-11-25.md`](./SITEMAP_UPDATE_2026-11-25.md) — Latest 397-URL catalog sitemap update log
- [`./SEO_MIGRATION.md`](./SEO_MIGRATION.md) — Name-only slug routing & 301 redirect architecture
