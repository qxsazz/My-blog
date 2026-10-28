# Online presence

The Astro content remains statically generated. `scripts/build-presence.mjs` packages the static build in `dist/client` and the same-origin Worker in `dist/server`. Static requests use the `ASSETS` binding; POST `/api/presence` uses `DB` (D1). Keep the existing Sites project ID and audience. The preview and live projects have separate databases provisioned under their respective Sites project IDs.

## Counting

Each browser profile stores a random UUID in localStorage; each document has a separate random tab UUID. Heartbeats renew a 90-second lease. The SQL count is distinct browser UUIDs with an unexpired tab lease. A normal pagehide releases that tab; other tabs remain counted. A hidden document stops heartbeats immediately and releases its tab after 30 seconds; mobile suspension or failed leave requests fall back to the 90-second expiry. A single controller survives Astro route changes. Updates occur every 15 seconds, so presence is approximate rather than a census of real humans. With localStorage blocked, different tabs may count separately.

The browser identifier stays in localStorage until cleared. Live rows and minute-bucket hashed rate keys are deleted opportunistically on subsequent requests after expiry. Rows may remain at rest until the next request, but expired rows never count. There is no cumulative visitor history and no stored browsing path, account identity or raw IP. Cross-origin requests, invalid UUIDs and bodies over 512 bytes are rejected; a short-lived server-side rate bucket allows 120 requests per minute per IP/user-agent combination. This limits casual bursts and is not full bot protection.

## Data migrations

`drizzle/0000_presence.sql` creates two isolated transient tables and expiry indexes. No schema DDL runs during requests. Sites must bind DB and apply the tracked migrations before the first request. The deployment archive includes the root `drizzle/` journal and SQL alongside `.openai/hosting.json` and `dist/`; keep this migration directory when packaging. Local verification used Wrangler's local D1; no local credentials or database state are included in the archive.

## Verification

- `npm run build`: Astro diagnostics/build and Worker/asset packaging.
- `npm test`: origin, size, input, unavailable state, rate limit, actual SQLite deduplication, leave and lease expiry.
- `npm run preview`: builds the current source, applies pending local migrations and serves the full Worker at `http://127.0.0.1:4321`. Pass `-- --port 4328` to select a different port. Wrangler is a pinned local development dependency; no global install or cloud credentials are required.
- `npm run db:migrate:local`: applies pending migrations after a build without starting the server. Both commands always pass `--local` and use `.wrangler/preview-state`; they never touch the hosted database. Applied local migrations are tracked by Wrangler, so restarting does not replay schema DDL.
- `npm run dev` remains the faster frontend-only Astro HMR server. Use the full preview for API and database verification, including separate browser contexts and same-context tabs.

UI starts with `正在连接…`, shows `N 人此刻在读` only after a valid response, and shows unavailable/offline states instead of a false zero. No synthetic visitors are seeded.
