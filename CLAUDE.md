# FabWorks

Shop floor production tracking app for HighCraft (cabinet manufacturing). Live at **shop.fabworks.app**.

## Stack

- **Runtime:** Cloudflare Worker (Hono framework)
- **Database:** Cloudflare D1 (SQLite), migrations in `schema/001-015`
- **Storage:** Cloudflare R2 (`fabworks-photos`) for FixIt photo uploads
- **UI:** Server-side HTML rendering with inline `<style>` and `<script>` blocks. No bundler, no React, no client-side framework.
- **Shared client JS:** `SHARED_JS` template literal in `layout.ts` — injected into every page's `<script>` block. Contains `escHtml()`, `timeAgo()`, `fmtTime()`, `fmtMin()`.
- **Deploy:** `npx wrangler deploy` — pushes to Cloudflare edge
- **Type check:** `npx tsc --noEmit`

## Architecture

Single entry point: `src/index.ts` (~1800 lines) — types, config templates, auth middleware, all API routes, page routes.

UI pages in `src/ui/`:
| File | Page(s) | Lines |
|------|---------|-------|
| `layout.ts` | Nav bar, `page()` template, shared CSS/JS, QR FAB, global QR router | 631 |
| `scan.ts` | `/scan` — station carousel, job lookup, entity picker, QR handler | 535 |
| `workbench.ts` | `/workbench` (build timer) + `/` My Workbench (assembler home) | 561 |
| `jobs.ts` | `/jobs/new`, `/job/:id`, `/job/:id/progress` | 633 |
| `stations.ts` | `/stations` — station view with carousel + staging view | 476 |
| `kpi.ts` | `/kpi` + `/takt` — assembler performance dashboards | 416 |
| `admin.ts` | `/admin` — user CRUD, config editor, shop type reset | 397 |
| `qr.ts` | `/qr` — QR code generation (stations, job labels, flags, system, build start) | 341 |
| `dashboard.ts` | `/dashboard` — splash mode + job hub mode | 340 |
| `staging.ts` | `/staging` — search bar + progress tracking | 290 |
| `fixit.ts` | `/fixit` — issue queue with resolve flow | 151 |
| `profile.ts` | `/profile` — user profile editor | 143 |
| `station-menu.ts` | `/menu/:slug` — configurable station menu pages | 75 |
| `login.ts` | `/login` | 150 |
| `components/notes.ts` | Reusable notes panel component | 101 |

## Key Patterns

- **`page()` function** (layout.ts): `page(title, extraStyles, body, script, user, currentPath, cdnScripts, config)` — wraps everything in the HTML shell with nav, styles, and script injection.
- **No client bundler** — all client JS is in template literal strings inside TypeScript functions. Use `var` not `const`/`let` for broadest compat.
- **Dynamic CSS classes** — `pillColor()` returns color names, classes constructed as `'pill-' + pillColor(status)`. Don't delete pill CSS thinking it's unused.
- **`displayStatusJS(config)`** — injects a `displayStatus()` function that maps status slugs to human labels based on tenant config.
- **Role system:** `user < lead < supervisor < admin`. `ROLE_LEVELS` maps to numbers. `requireAuth(minRole)` middleware gates routes.
- **QR protocol:** `fw:<action>:<target>` — global router in `layout.ts` handles `build`, `menu`, `cmd`. Page-specific handlers via `window._fabworksHandleQR`.
- **Tenant config:** Shop type templates (cabinet_shop, metal_fab, woodworking) define stations, entity labels (l1=Job, l2=Bucket, l3=Cabinet), and status flow.

## Data Model

```
jobs (id, job_number, job_name, status, cabinet_count)
  └─ buckets (id, job_id, name, cabinet_count, status)
       └─ cabinets (id, job_id, bucket_id, cabinet_number, label, status, flags JSON,
                    staging_location, accessories, notes, assembly_sheet_url)
            └─ scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at)
            └─ build_sessions (id, cabinet_id, job_id, user_id, started_at, completed_at,
                               paused_at, total_paused_seconds)
            └─ fixit_requests (id, cabinet_id, build_session_id, root_cause, description,
                               photo_key, status, requested_by, resolved_by, resolution_note)

users (id, name, email, pin, role, home_page, phone, avatar_color)
sessions (id, user_id, expires_at)
config (id, shop_type, entity_labels, stations, l3_statuses, l3_terminal_status, station_menus)
notes (id, context_type, context_id, title, content, author_id, created_at)
daily_briefs (id, brief_date, content, updated_by)
```

## Nav Structure

Static 5-zone top bar: `Dash | Build | Stations(dropdown) | Tools(dropdown) | User(dropdown)`
- **Stations dropdown:** configured station menus + Staging + Station View
- **Tools dropdown:** KPI, Takt, FixIt (lead+), New Job, QR Codes (admin for full, lead for labels+flags)
- **User dropdown:** Profile, Set as Home, Admin section (admin only), Log out

## Cabinet Flags

`flags` column is JSON array. Valid flags: `hold`, `remake`, `missing_part`, `priority`.
API: `POST /api/cabinets/:id/flag` (lead+). QR codes: `fw:flag:<slug>`.

## Common Tasks

- **Add a new page:** Create `src/ui/newpage.ts`, export from `src/ui/index.ts`, add route in `src/index.ts`, add to nav in `layout.ts` if needed.
- **Add a migration:** Create `schema/NNN_name.sql`, run with `npx wrangler d1 execute fabworks-db --remote --file=schema/NNN_name.sql`.
- **Add a QR command:** Add case to `onGlobalQR` in `layout.ts` for global commands, or to `handleQR` in `scan.ts` for scan-context commands.
- **Add shared client JS:** Add to `SHARED_JS` in `layout.ts`. All pages that use `${SHARED_JS}` get it automatically.

## Deploy Checklist

1. `npx tsc --noEmit` — must pass
2. `npx wrangler deploy` — pushes to edge
3. Migrations run separately via `npx wrangler d1 execute fabworks-db --remote --file=schema/NNN.sql`

## Session Continuity

**Last session:** 2026-05-25
**Last deploy:** `7f514ef` — Phase 11 (Asana Integration) + build-complete status fix

### What just shipped (Phase 9: Push Notifications)
- Web Push API with RFC 8291 encryption (pure Web Crypto, no Node.js deps)
- `src/push.ts` — VAPID JWT signing, ECDH payload encryption, send helpers
- `schema/017_push_subscriptions.sql` — per-device subscription storage
- 4 API endpoints: `/api/push/vapid-key`, `/api/push/subscribe`, DELETE subscribe, `/api/push/status`
- 4 notification triggers via `c.executionCtx.waitUntil()`:
  - Build complete → leads/supervisors/admins
  - FixIt submitted → leads/supervisors/admins
  - FixIt resolved → original requester
  - Cabinet flagged → leads/supervisors/admins (excluding flagger)
- Service worker push + notificationclick handlers (SW_VERSION v2)
- Profile page: Enable/Disable notifications toggle
- VAPID keys stored as Wrangler secrets

### Also shipped this session (Phase 8: Reporting / Export)
- `/reports` page with 3 tabs + CSV downloads
- Weekly summary card on dashboard
- `csvRow()` / `csvResponse()` utilities

### Also shipped this session (Phase 10: Offline Queue Viewer + Photo Queuing)
- Pending queue viewer panel: tap badge → slide-down overlay with all queued items
- Per-item: type pill, human label, timestamp, retry count, retry/discard buttons
- Discard all button, live updates via SW message bus, close on tap outside
- SW commands: `retry-item`, `discard-item`, `discard-all`, `queue-fixit`
- FixIt photo queuing: client-side compression (canvas 1200px, JPEG 0.7) → base64 to IDB
- On drain: reconstructs FormData with photo blob from base64
- Queue viewer shows camera icon (has photo) or warning icon (no photo) on FixIt items

### What just shipped (Phase 11: Asana Integration)
- `src/asana.ts` — full Asana sync engine: webhook verification, REST API client, entity mappings, bidirectional sync
- `schema/018_asana_webhooks.sql` — webhook registration + event queue tables
- `schema/019_asana_mappings.sql` — FabWorks ↔ Asana entity mapping table
- Inbound sync: Asana task completion → updates FabWorks bucket/cabinet status via event queue
- Outbound sync: terminal-status scans → complete Asana task; FixIt → create REWORK task in [CNC] section
- Webhook registration endpoint: `POST /api/asana/webhook/register` (admin)
- Entity mapping endpoint: `POST /api/asana/mappings` (admin)
- Combined status endpoint: `GET /api/asana/status` (admin)
- Admin UI: Asana tab with connection status, webhook management, queue stats, entity mapping form
- Data model: Job=Asana Project, Bucket=Task, Cabinet=Subtask

### Roadmap (next up, priority order)
1. Multi-shift support / time tracking
2. Google Workspace integration — pull job data from sheets
3. Email digest — automated weekly summary to ownership

### Completed phases
- Phase 1: Cabinet Metadata & Assembly Sheet Links
- Phase 2: Build Timer / Workbench Mode
- Phase 3: FixIt System
- Phase 4: Role-Based Home Screens
- Phase 5: UX Polish + QR Protocol (nav redesign, dead code sweep, fw: command protocol, flags, staging)
- Phase 6: Offline Mode (service worker, queue, read cache)
- Phase 7: Cabinet Detail Page + Properties System (detail page, per-shop-type property config, CSV import, clickable cabinets everywhere)
- Phase 8: Reporting / Export (reports page, CSV downloads, weekly summary card)
- Phase 9: Push Notifications (Web Push, role-based triggers, profile subscription UI)
- Phase 10: Offline Queue Viewer + Photo Queuing (pending panel UI, retry/discard, FixIt photo compression + IDB serialization)
- Phase 11: Asana Integration (webhook ingestion, bidirectional sync, entity mapping, admin UI)
