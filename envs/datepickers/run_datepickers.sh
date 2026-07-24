#!/usr/bin/env bash
# run_datepickers.sh — boot the Datepicker synthetic env in tmux.
# Single-server: backend serves per-task scenario SPAs + API. The downloaded
# DB defaults to the grounded DB used by the shipped release test tasks. Bind host 0.0.0.0.
# PORT overridable (PORT=8102 ...) for multi-env runs.
#
# Modes:
#   Browse ALL (default): build EVERY frontend scenario (progress bar) and serve
#     the browse list + dashboard so every task page is viewable.
#       bash run_datepickers.sh
#   Single task: build just one task's scenario and serve it.
#       BUILD_ALL=0 TASK_ID=task_0005 bash run_datepickers.sh
set -euo pipefail

ENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION="datepickers"
PORT="${PORT:-5400}"
HOST="0.0.0.0"
DB="${DB:-./datepicker_grounded.db}"
TASK_ID="${TASK_ID:-task_0001}"
BUILD_ALL="${BUILD_ALL:-1}"

# Render a [####----] progress bar: progress_bar <current> <total> <suffix>
progress_bar() {
  local cur=$1 total=$2 suffix="${3:-}" width=40 i filled bar='' empty=''
  filled=$(( total > 0 ? cur * width / total : 0 ))
  for ((i=0; i<filled; i++)); do bar+='#'; done
  for ((i=filled; i<width; i++)); do empty+='-'; done
  printf '\r  [%s%s] %d/%d  %-28s' "$bar" "$empty" "$cur" "$total" "$suffix"
}

echo "==> Killing any existing tmux session: $SESSION"
tmux kill-session -t "$SESSION" 2>/dev/null || true

echo "==> Installing Python deps (uv sync)"
(cd "$ENV_DIR" && uv sync)

if [ ! -f "$ENV_DIR/$DB" ]; then
  echo "!! $DB not found. Download it first:"
  echo "   uv run --with azure-identity --with azure-storage-blob --with tqdm \\"
  echo "       python scripts/download_synthetic_env_dbs.py --env datepickers"
  exit 1
fi

if [ "$BUILD_ALL" = "1" ]; then
  echo "==> Building ALL frontend scenarios in PARALLEL (xargs -P 8; skips already-built dist/)"
  total=$(cd "$ENV_DIR/frontend/envs" && ls -d */ 2>/dev/null | wc -l)
  # Emit only scenarios still needing a build (dist/ missing), build up to 8 at a time.
  # Serial build of ~100 sub-apps took ~85min; -P 8 cuts it to ~15-20min. dist/ skip-guard
  # keeps warm rebuilds fast.
  ( cd "$ENV_DIR/frontend/envs"
    for s in */; do s="${s%/}"; [ -f "$s/package.json" ] && [ ! -d "$s/dist" ] && echo "$s"; done \
      | xargs -r -P 8 -n1 sh -c 'echo "  building $0 ..."; (cd "$0" && npm install --silent && npm run build >/dev/null 2>&1) || echo "  !! FAILED: $0"'
  )
  built=$(cd "$ENV_DIR/frontend/envs" && for d in */; do [ -d "${d}dist" ] && echo x; done | wc -l)
  echo "  scenarios with dist/: $built / $total"

  echo "==> Launching backend (browse mode) in tmux window 'backend' on $HOST:$PORT"
  tmux new-session -d -s "$SESSION" -n backend \
    "cd '$ENV_DIR' && uv run python -m backend.app --host $HOST --port $PORT --db $DB 2>&1 | tee /tmp/${SESSION}_backend.log"

  echo "==> Waiting for service to come up..."
  for i in $(seq 1 30); do
    root_ok=$(curl -sL -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" 2>/dev/null || echo 000)
    dash_ok=$(curl -s  -o /dev/null -w '%{http_code}' "http://localhost:$PORT/dashboard" 2>/dev/null || echo 000)
    echo "  [$i] /=$root_ok  /dashboard=$dash_ok"
    if [ "$root_ok" = "200" ] && [ "$dash_ok" = "200" ]; then
      echo "==> Service is UP (browse mode)."
      echo "    Browse list : http://$HOST:$PORT/"
      echo "    Dashboard   : http://$HOST:$PORT/dashboard"
      echo "    Attach      : tmux attach -t $SESSION"
      exit 0
    fi
    sleep 2
  done
  echo "!! Service did not become healthy in time. Recent backend log:"
  tail -n 40 /tmp/${SESSION}_backend.log 2>/dev/null || true
  exit 1
fi

echo "==> Resolving scenario (env_name) for $TASK_ID from $DB"
ENV_NAME=$(cd "$ENV_DIR" && python3 -c "import sqlite3; r=sqlite3.connect('$DB').execute('SELECT env_name FROM taskrecord WHERE task_id=?',('$TASK_ID',)).fetchone(); print(r[0] if r else '')")
if [ -z "$ENV_NAME" ]; then
  echo "!! Task $TASK_ID not found in $DB"; exit 1
fi
echo "    $TASK_ID -> scenario '$ENV_NAME'"

echo "==> Building frontend scenario '$ENV_NAME' (npm install && npm run build)"
(cd "$ENV_DIR/frontend/envs/$ENV_NAME" && npm install && npm run build)

echo "==> Launching backend in tmux window 'backend' on $HOST:$PORT"
tmux new-session -d -s "$SESSION" -n backend \
  "cd '$ENV_DIR' && uv run python -m backend.app --host $HOST --port $PORT --db $DB --task $TASK_ID 2>&1 | tee /tmp/${SESSION}_backend.log"

echo "==> Waiting for service to come up..."
for i in $(seq 1 30); do
  root_ok=$(curl -sL -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" 2>/dev/null || echo 000)
  task_ok=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/task/$TASK_ID" 2>/dev/null || echo 000)
  echo "  [$i] /=$root_ok  /task/$TASK_ID=$task_ok"
  if [ "$root_ok" = "200" ] && [ "$task_ok" = "200" ]; then
    echo "==> Service is UP."
    echo "    Task page : http://$HOST:$PORT/task/$TASK_ID  (scenario: $ENV_NAME)"
    echo "    Attach    : tmux attach -t $SESSION"
    exit 0
  fi
  sleep 2
done

echo "!! Service did not become healthy in time. Recent backend log:"
tail -n 40 /tmp/${SESSION}_backend.log 2>/dev/null || true
exit 1
