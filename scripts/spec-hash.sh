#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
bun run emit-spec | shasum -a 256 | awk '{print $1}'
