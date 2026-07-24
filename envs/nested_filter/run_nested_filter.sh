#!/usr/bin/env bash
# run_nested_filter.sh — boot the Nested-Filter env in tmux.
# Backend serves prebuilt per-widget static frontends + API. Self-contained:
# the DB is built per-task from backend/data/<env>/seed_data.json at startup,
# so no npm build is needed. --task is REQUIRED (selects the active env).
#
# The backend serves ONE active env at a time (derived from the task id, e.g.
# W01_E01_T001 -> env W01_E01). Override the task via env var:
#   TASK_ID=W05_E03_T001 bash run_nested_filter.sh
# Bind host 0.0.0.0. PORT overridable (PORT=8105 ...) for multi-env runs.
set -euo pipefail

ENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION="nested_filter"
PORT="${PORT:-5500}"
HOST="0.0.0.0"
DB="${DB:-./nested_filter.db}"
TASK_ID="${TASK_ID:-W01_E01_T001}"

echo "==> Killing any existing tmux session: $SESSION"
tmux kill-session -t "$SESSION" 2>/dev/null || true

echo "==> Installing Python deps (uv sync)"
(cd "$ENV_DIR" && uv sync)

# env_id is the first two underscore parts of the task id (W01_E01_T001 -> W01_E01)
ENV_ID="$(echo "$TASK_ID" | cut -d_ -f1-2)"
echo "==> Task $TASK_ID -> env $ENV_ID"

echo "==> Launching backend in tmux window 'backend' on $HOST:$PORT"
tmux new-session -d -s "$SESSION" -n backend \
  "cd '$ENV_DIR' && uv run python -m backend.app --host $HOST --port $PORT --task $TASK_ID --db $DB 2>&1 | tee /tmp/${SESSION}_backend.log"

echo "==> Waiting for service to come up..."
for i in $(seq 1 30); do
  root_ok=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" 2>/dev/null || echo 000)
  env_ok=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/env/$ENV_ID" 2>/dev/null || echo 000)
  tasks_ok=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/env/$ENV_ID/api/tasks" 2>/dev/null || echo 000)
  echo "  [$i] /=$root_ok  /env/$ENV_ID=$env_ok  /api/tasks=$tasks_ok"
  if [ "$env_ok" = "200" ] && [ "$tasks_ok" = "200" ]; then
    echo "==> Service is UP."
    echo "    App     : http://$HOST:$PORT/  (active env: $ENV_ID)"
    echo "    Env page: http://$HOST:$PORT/env/$ENV_ID"
    echo "    Attach  : tmux attach -t $SESSION"
    exit 0
  fi
  sleep 2
done

echo "!! Service did not become healthy in time. Recent backend log:"
tail -n 40 /tmp/${SESSION}_backend.log 2>/dev/null || true
exit 1
