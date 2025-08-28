#!/usr/bin/env bash
set -euo pipefail
curl -s -X POST "http://localhost:7072/answer" \
  -H "Content-Type: application/json" \
  -d '{"question":"How do I get an Arizona state ID after release?","state":"AZ"}' | jq .

