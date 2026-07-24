#!/usr/bin/env bash
# run_echoforge.sh — boot the EchoForge synthetic env in tmux.
# Single-server (production): backend serves the built SPA + API on :8051.
#
# Relies on the pre-built grounding database `echoforge.db` (full re-skinned GitLab corpus from WebArena, ~344 MB:
# 2399 users, 175 projects, 80,962 issues, 134,336 MRs, 303,407 notes, 545 milestones). NOT
# seeded/migrated at runtime. It is not bundled in the repo due to size — download it and place
# it at ./echoforge.db (see the top-level release documentation for the download location).
set -euo pipefail
ENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION="echoforge"; PORT="${PORT:-8051}"; DB="${DB:-./echoforge.db}"; USER_ID="${USER_ID:-2330}"
if [ ! -f "$ENV_DIR/echoforge.db" ] && [ ! -f "$DB" ]; then
  echo "!! echoforge.db not found. Download it (see the release documentation) and place it at:"
  echo "   $ENV_DIR/echoforge.db"
  exit 1
fi
tmux kill-session -t "$SESSION" 2>/dev/null || true
(cd "$ENV_DIR" && uv sync)
(cd "$ENV_DIR/frontend" && npm install && npm run build)
tmux new-session -d -s "$SESSION" -n backend \
  "cd '$ENV_DIR' && uv run python -m backend.app --host 0.0.0.0 --port $PORT --db $DB --user $USER_ID 2>&1 | tee /tmp/${SESSION}_backend.log"
for i in $(seq 1 30); do
  root_ok=$(curl -sL -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" 2>/dev/null || echo 000)
  api_ok=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/api/projects" 2>/dev/null || echo 000)
  echo "  [$i] /=$root_ok /api/projects=$api_ok"
  if [ "$root_ok" = "200" ] && [ "$api_ok" = "200" ]; then
    echo "==> UP: http://localhost:$PORT (docs: /docs). Default user id $USER_ID (byteblaze)."; exit 0; fi
  sleep 2
done
echo "!! not healthy"; tail -n 40 /tmp/${SESSION}_backend.log 2>/dev/null || true; exit 1
