#!/usr/bin/env bash
# run_echostay.sh — boot the EchoStay synthetic env in tmux.
# Single-server (production): backend serves the built SPA + API.
# Uses the downloaded ./echostay.db (does NOT re-seed). Bind host is 0.0.0.0.
# PORT is overridable (PORT=8100 bash run_echostay.sh) for multi-env runs.
set -euo pipefail

ENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION="echostay"
PORT="${PORT:-8000}"
HOST="0.0.0.0"
DB="${DB:-./echostay.db}"

echo "==> Killing any existing tmux session: $SESSION"
tmux kill-session -t "$SESSION" 2>/dev/null || true

echo "==> Installing Python deps (uv sync)"
(cd "$ENV_DIR" && uv sync)

if [ ! -f "$ENV_DIR/$DB" ]; then
  echo "!! $DB not found. Download it (see the top-level release documentation) and place it at:"
  echo "   $ENV_DIR/echostay.db"
  exit 1
fi

echo "==> Building frontend SPA (npm install && npm run build)"
(cd "$ENV_DIR/frontend" && npm install && npm run build)

echo "==> Launching backend in tmux window 'backend' on $HOST:$PORT"
tmux new-session -d -s "$SESSION" -n backend \
  "cd '$ENV_DIR' && uv run python -m backend.app --host $HOST --port $PORT --db $DB --user 1 2>&1 | tee /tmp/${SESSION}_backend.log"

echo "==> Waiting for service to come up..."
for i in $(seq 1 30); do
  docs_ok=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/docs" 2>/dev/null || echo 000)
  root_ok=$(curl -sL -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" 2>/dev/null || echo 000)
  api_ok=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/api/listings" 2>/dev/null || echo 000)
  echo "  [$i] /docs=$docs_ok  /=$root_ok  /api/listings=$api_ok"
  if [ "$root_ok" = "200" ] && { [ "$docs_ok" = "200" ] || [ "$api_ok" = "200" ]; }; then
    echo "==> Service is UP."
    echo "    App + API : http://$HOST:$PORT  (API docs: /docs)"
    echo "    Attach    : tmux attach -t $SESSION"
    exit 0
  fi
  sleep 2
done

echo "!! Service did not become healthy in time. Recent backend log:"
tail -n 40 /tmp/${SESSION}_backend.log 2>/dev/null || true
exit 1
