# Elovate Frontend

Next.js (App Router) + TypeScript + Tailwind CSS client for Elovate.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+

## Setup

From this folder:

```bash
pnpm install
```

## Run

Development server (default: [http://localhost:3000](http://localhost:3000)):

```bash
pnpm dev
```

Production build and start:

```bash
pnpm build
pnpm start
```

Lint:

```bash
pnpm lint
```

## Routes

| Path | Status |
| --- | --- |
| `/` and `/login` | Sign in UI |
| `/signup` | Create account UI |
| `/student` | Stub |
| `/educator` | Stub |

## Structure

- `src/app` — routes
- `src/features` — feature modules (`login`, `student`, `educator`)
- `src/components` — shared UI and icons
- `public` — static assets (brand SVGs)
