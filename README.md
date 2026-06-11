# Naturelap Monorepo

## Project Overview

Naturelap is a monorepo containing a full-stack application with:

- `apps/web` — React + Vite frontend
- `apps/api` — Express backend API
- `apps/pocketbase` — PocketBase data service, migrations, and hooks

The repository uses npm workspaces and `concurrently` for local development orchestration.

## Repository Structure

- `package.json` — Root workspace config and cross-app scripts
- `apps/web` — Frontend application
- `apps/api` — Backend service
- `apps/pocketbase` — PocketBase server, migrations, and hooks

## Local Development

Install dependencies at the repository root:

```bash
npm install
```

Start the full local stack:

```bash
npm run dev
```

This runs:

- `apps/web` on `http://localhost:3000`
- `apps/api` on `http://localhost:3001`
- `apps/pocketbase` on `http://localhost:8090`

## Root Scripts

- `npm run dev` — starts web, api, and pocketbase together
- `npm run build` — builds the frontend only
- `npm run start` — starts api and pocketbase for production-like runtime
- `npm run lint` — runs lint for `apps/web` and `apps/api`

## apps/web

Frontend details:

- Entrypoint: Vite development server
- Local dev server: `http://localhost:3000`
- Build output: `../../dist/apps/web`
- Uses React, Tailwind CSS, Radix UI, PocketBase JS SDK, and custom Vite plugins

Package scripts:

- `npm run dev` — `vite --host :: --port 3000`
- `npm run build` — `node tools/generate-llms.js || true && vite build --outDir ../../dist/apps/web`
- `npm run start` — `vite preview --outDir ../../dist/apps/web --host :: --port 3000`
- `npm run lint` — `eslint . --quiet`

PocketBase client configuration:

- Dev: `http://localhost:8090`
- Production: `/hcgi/platform`

Environment vars in `apps/web/.env.local`:

- `VITE_DEV_POCKETBASE_URL` — local PocketBase URL for dev
- `VITE_LIVE_POCKETBASE_URL` — production PocketBase URL

## apps/api

Backend details:

- Server: Express 5
- Port: defaults to `3001`
- Middleware: `helmet`, `cors`, `morgan`, JSON body parsing, URL-encoded parsing
- Routes are mounted under `/` and include health, auth, catalog, cart, orders, bookings, payments, users, notifications, promotions, analytics, and support
- Uses a PocketBase client for backend data access and superuser authentication

Package scripts:

- `npm run dev` — `node src/main.js`
- `npm run start` — `node src/main.js`
- `npm run lint` — `eslint . --quiet`

API environment variables:

- `PORT` — API server port (default `3001`)
- `CORS_ORIGIN` — allowed CORS origin (default `http://localhost:3000`)
- `NODE_ENV`
- `POCKETBASE_URL` — optional PocketBase host for API client
- `WEBSITE_DOMAIN` — used to build the PocketBase host URL in production
- `PB_SUPERUSER_EMAIL` — PocketBase superuser email for auth
- `PB_SUPERUSER_PASSWORD` — PocketBase superuser password
- `PB_ENCRYPTION_KEY` — PocketBase encryption key

The API includes a health endpoint at `/health` and a 404 fallback for unmatched routes.

## apps/pocketbase

PocketBase service details:

- Serves on `0.0.0.0:8090`
- Uses migrations in `apps/pocketbase/pb_migrations`
- Uses hooks in `apps/pocketbase/pb_hooks`
- Stores runtime data under `apps/pocketbase/pb_data`

Package scripts:

- `npm run dev` — serve PocketBase in dev mode without persisted data directory
- `npm run start` — serve PocketBase with data dir, migrations, and hooks
- `npm run migrations:up` — apply migrations
- `npm run migrations:revert` — revert migrations
- `npm run migrations:snapshot` — snapshot collection schema
- `npm run update` — update the PocketBase binary

PocketBase environment variables:

- `PB_ENCRYPTION_KEY`
- `PB_SUPERUSER_EMAIL`
- `PB_SUPERUSER_PASSWORD`

## Deployment Notes

- The frontend expects PocketBase to be available at `/hcgi/platform` in production.
- The backend expects `WEBSITE_DOMAIN` to be set when targeting the production PocketBase host.
- The root `npm run start` command starts both `apps/api` and `apps/pocketbase` with default dev credentials.

## Useful Paths

- `apps/web` — web app source, Vite config, plugins, and Tailwind config
- `apps/api` — Express server, route modules, middleware, and PocketBase integration
- `apps/pocketbase` — PocketBase binary, migrations, hooks, and data storage

## Tips

- Use `npm install` from the repository root to install all workspace dependencies.
- If you only want to develop one app, run its script from its folder with `npm run dev --prefix apps/web` or `npm run dev --prefix apps/api`.
- Keep PocketBase env vars consistent across local dev and production deployments.
