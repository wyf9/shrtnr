#!/usr/bin/env bash
# Copyright 2026 Oddbit (https://oddbit.id)
# SPDX-License-Identifier: Apache-2.0
#
# Cross-SDK end-to-end test runner.
#
# Spawns `wrangler dev` in the background against a local miniflare-backed
# D1, mints an API key, exports SHRTNR_TEST_URL + SHRTNR_TEST_API_KEY, and
# runs every SDK's e2e suite against the same running server. All three
# SDKs hit the real HTTP surface with a real bearer token; a missing
# route or contract drift fails immediately.
#
# Usage:
#   scripts/test-sdks-e2e.sh            # run all SDKs
#   scripts/test-sdks-e2e.sh ts         # run only TypeScript
#   scripts/test-sdks-e2e.sh python     # run only Python
#   scripts/test-sdks-e2e.sh dart       # run only Dart
#
# Requirements:
#   - yarn (for wrangler dev)
#   - node/tsx for TS e2e (already present via yarn)
#   - python3 with sdk/python/.venv already set up
#       (cd sdk/python && python3 -m venv .venv && .venv/bin/pip install -e '.[dev]')
#   - dart (for pub.dev SDK e2e)
#
# Exits non-zero if any selected SDK's e2e suite fails.

set -euo pipefail

PORT="${SHRTNR_TEST_PORT:-8791}"
URL="http://127.0.0.1:${PORT}"
IDENTITY="e2e@shrtnr.test"

SDKS=("${@:-ts python dart}")
if [ "$#" -eq 0 ]; then
  SDKS=(ts python dart)
else
  SDKS=("$@")
fi

WRANGLER_LOG=$(mktemp)
WRANGLER_PID=""

cleanup() {
  if [ -n "$WRANGLER_PID" ] && kill -0 "$WRANGLER_PID" 2>/dev/null; then
    echo "==> stopping wrangler dev (pid $WRANGLER_PID)"
    kill "$WRANGLER_PID" 2>/dev/null || true
    wait "$WRANGLER_PID" 2>/dev/null || true
  fi
  rm -f "$WRANGLER_LOG"
}
trap cleanup EXIT INT TERM

echo "==> starting wrangler dev on :${PORT}"
DEV_IDENTITY="$IDENTITY" yarn dev --port "$PORT" >"$WRANGLER_LOG" 2>&1 &
WRANGLER_PID=$!

echo "==> waiting for /_/health"
for i in $(seq 1 60); do
  if curl -sf "$URL/_/health" >/dev/null 2>&1; then
    echo "==> server ready after ${i}s"
    break
  fi
  if ! kill -0 "$WRANGLER_PID" 2>/dev/null; then
    echo "!! wrangler dev exited before becoming ready" >&2
    cat "$WRANGLER_LOG" >&2
    exit 1
  fi
  sleep 1
done

if ! curl -sf "$URL/_/health" >/dev/null 2>&1; then
  echo "!! timed out waiting for /_/health" >&2
  cat "$WRANGLER_LOG" >&2
  exit 1
fi

echo "==> minting API key for $IDENTITY"
KEY_JSON=$(
  curl -sf \
    -H "Cf-Access-Authenticated-User-Email: $IDENTITY" \
    -H "Content-Type: application/json" \
    -d '{"title":"e2e-test","scope":"create,read"}' \
    "$URL/_/admin/api/keys"
)
API_KEY=$(printf '%s' "$KEY_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['raw_key'])")

if [ -z "$API_KEY" ]; then
  echo "!! failed to mint API key" >&2
  echo "response: $KEY_JSON" >&2
  exit 1
fi

export SHRTNR_TEST_URL="$URL"
export SHRTNR_TEST_API_KEY="$API_KEY"

FAILED=()

run_sdk() {
  local sdk="$1"
  local status=0
  echo
  echo "==> e2e: $sdk"
  case "$sdk" in
    ts|typescript|npm)
      (cd sdk/typescript && yarn install --frozen-lockfile --silent >/dev/null && yarn vitest run tests/e2e --passWithNoTests) || status=$?
      ;;
    python|py)
      if [ ! -x sdk/python/.venv/bin/pytest ]; then
        echo "!! sdk/python/.venv/bin/pytest missing. run: cd sdk/python && python3 -m venv .venv && .venv/bin/pip install -e '.[dev]'" >&2
        status=1
      else
        (cd sdk/python && .venv/bin/pytest -m e2e) || status=$?
      fi
      ;;
    dart|pub)
      (cd sdk/dart && dart pub get && dart test --tags e2e) || status=$?
      ;;
    *)
      echo "!! unknown sdk: $sdk" >&2
      status=2
      ;;
  esac
  if [ "$status" -ne 0 ]; then
    FAILED+=("$sdk")
  fi
}

for sdk in "${SDKS[@]}"; do
  run_sdk "$sdk"
done

echo
if [ "${#FAILED[@]}" -gt 0 ]; then
  echo "!! failing SDKs: ${FAILED[*]}" >&2
  exit 1
fi

echo "==> all selected SDKs passed"
