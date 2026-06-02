# FabWorks Platform — Setup Guide

Shop floor QR scan tracking. Cloudflare Worker + D1 + R2.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): `npm install -g wrangler`
- Cloudflare account with Workers, D1, and R2 enabled

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/YOUR_ORG/fabworks-platform
cd fabworks-platform
npm install
```

### 2. Configure Wrangler

Copy `wrangler.jsonc` and fill in your values:

```bash
# Create D1 database
npx wrangler d1 create fabworks-db
# → Copy the database_id into wrangler.jsonc

# Create R2 bucket
npx wrangler r2 bucket create fabworks-photos
```

Update `wrangler.jsonc`:
- Set `database_id` to your D1 database ID
- Optionally set `account_id` or export `CLOUDFLARE_ACCOUNT_ID`
- Uncomment and set `routes` for a custom domain

### 3. Run migrations

```bash
# Local dev
for f in schema/*.sql; do npx wrangler d1 execute fabworks-db --local --file="$f"; done

# Production
for f in schema/*.sql; do npx wrangler d1 execute fabworks-db --remote --file="$f"; done
```

### 4. Set secrets

```bash
npx wrangler secret put PIN_SALT          # any random string
npx wrangler secret put VAPID_PUBLIC_KEY  # generate with: npx web-push generate-vapid-keys
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put VAPID_SUBJECT     # mailto:you@example.com
# Optional: npx wrangler secret put ASANA_PAT
```

### 5. Create the first admin user

```bash
# After deploying, use the /admin page — or insert directly:
# PIN hash = SHA-256(PIN_SALT + "1234")
npx wrangler d1 execute fabworks-db --remote --command \
  "INSERT INTO users (name, email, pin, role) VALUES ('Admin', 'you@example.com', '<pin_hash>', 'admin')"
```

### 6. Dev & deploy

```bash
npm run dev      # local dev server at http://localhost:8787
npm run deploy   # push to Cloudflare edge
```

## Shop Types

On first login, go to **Admin → Config** and choose a shop template:

| Template | Levels | Use case |
|----------|--------|----------|
| `cabinet` | Job → Bucket → Cabinet | Cabinet manufacturing |
| `metal` | Project → Batch → Part | Metal fabrication |
| `wood` | Order → Group → Piece | Woodworking / millwork |

## Multi-tenancy

Current architecture is single-tenant per Worker deployment. To onboard a second customer, deploy a new Worker instance with its own D1 database. Full multi-tenancy (subdomain routing, shared infrastructure) is roadmapped for v0.2.

## License

MIT — free for commercial use.
