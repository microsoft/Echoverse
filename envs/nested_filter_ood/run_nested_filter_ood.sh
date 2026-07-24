#!/usr/bin/env bash
# run_nested_filter_ood.sh — boot the Nested-Filter OOD env in tmux.
# Backend serves prebuilt per-widget frontends + API on :5500. Self-contained:
# the DB is rebuilt (DROP+CREATE) from backend/data/<env>/seed_data.json at
# startup, so no DB download or npm build is needed.
#
# Override the task via env var, e.g.:  TASK_ID=W25_E03_T001 bash run_...sh
set -euo pipefail

ENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION="nested_filter_ood"
PORT="${PORT:-5501}"
DB="./nested_filter_ood.db"
TASK_ID="${TASK_ID:-W21_E01_T001}"

echo "==> Killing any existing tmux session: $SESSION"
tmux kill-session -t "$SESSION" 2>/dev/null || true

echo "==> Installing Python deps (uv sync)"
(cd "$ENV_DIR" && uv sync)

# env_id is the first two underscore parts of the task id (e.g. W21_E01_T001 -> W21_E01)
ENV_ID="$(echo "$TASK_ID" | cut -d_ -f1-2)"
echo "==> Task $TASK_ID -> env $ENV_ID"

echo "==> Launching backend in tmux window 'backend'"
tmux new-session -d -s "$SESSION" -n backend \
  "cd '$ENV_DIR' && uv run python -m backend.app --host 0.0.0.0 --port $PORT --task $TASK_ID --db $DB 2>&1 | tee /tmp/${SESSION}_backend.log"

echo "==> Waiting for service to come up..."
for i in $(seq 1 30); do
  root_ok=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" 2>/dev/null || echo 000)
  env_ok=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/env/$ENV_ID" 2>/dev/null || echo 000)
  tasks_ok=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/env/$ENV_ID/api/tasks" 2>/dev/null || echo 000)
  echo "  [$i] /=$root_ok  /env/$ENV_ID=$env_ok  /api/tasks=$tasks_ok"
  if [ "$root_ok" = "200" ] && [ "$env_ok" = "200" ] && [ "$tasks_ok" = "200" ]; then
    echo "==> Service is UP."
    echo "    App     : http://localhost:$PORT/  (active env: $ENV_ID)"
    echo "    Env page: http://localhost:$PORT/env/$ENV_ID"
    echo "    Attach  : tmux attach -t $SESSION"
    exit 0
  fi
  sleep 2
done

echo "!! Service did not become healthy in time. Recent backend log:"
tail -n 40 /tmp/${SESSION}_backend.log 2>/dev/null || true
exit 1
