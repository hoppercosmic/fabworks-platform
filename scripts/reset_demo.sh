#!/usr/bin/env bash
# Refresh the cab1 demo data on the LIVE database.
# Run this the morning of the demo so "today" counts anchor to the demo day.
# (The seed uses datetime('now',...), so re-applying makes today = today.)
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Regenerating seed..."
node scripts/gen_seed_cab1.js
echo "Applying to live cab1-db..."
npx wrangler d1 execute cab1-db --remote --file=schema/seed_cab1.sql -y
echo "Done. Today's completions:"
npx wrangler d1 execute cab1-db --remote --command \
  "SELECT count(*) AS today_completed FROM build_sessions WHERE completed_at IS NOT NULL AND DATE(completed_at)=DATE('now');"
