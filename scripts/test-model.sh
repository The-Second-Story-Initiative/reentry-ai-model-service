#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-7071}"
curl -s -X POST "http://localhost:${PORT}/generate" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello from Second Story!"}]}' | jq .

