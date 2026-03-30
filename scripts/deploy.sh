#!/usr/bin/env bash
# Deploy script for Cloudflare Workers Builds.
#
# Replaces the D1 database_id placeholder in wrangler.toml with the value
# of the D1_DATABASE_ID environment variable, runs migrations, then deploys.
#
# Set D1_DATABASE_ID in your Workers Builds environment variables
# (Cloudflare dashboard > Workers & Pages > Settings > Build > Environment variables).

set -euo pipefail

if [ -n "${D1_DATABASE_ID:-}" ]; then
  sed -i "s/database_id = \"DATABASE_ID\"/database_id = \"${D1_DATABASE_ID}\"/" wrangler.toml
  echo "Injected D1_DATABASE_ID into wrangler.toml"
else
  echo "Warning: D1_DATABASE_ID is not set; wrangler.toml unchanged"
fi

wrangler d1 migrations apply DB --remote
wrangler deploy
