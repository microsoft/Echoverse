# datepickers_ood

> Part of the Echoverse **capability worlds** — the out-of-distribution date-picker split, held
> out for evaluation. See the top-level [README](../../README.md) and
> [Transparency Note](../../TRANSPARENCY.md).

An **out-of-distribution** counterpart to `datepickers`: novel date-picker widget types
and scenarios the in-distribution set does not cover. Test-only.

## Run

```bash
cd envs/datepickers_ood
uv run python -m backend.app --host 0.0.0.0 --port 5401 \
    --db ./datepicker_ood_grounded.db --task dph_0001
```
Open `http://localhost:5401/task/<task_id>`. Each scenario's frontend is a Vite/React sub-app under
`frontend/envs/<scenario>/`. Use the repo-root `harness/` to run many instances concurrently.

## Tasks

Single test set: **`tasks/test_tasks.jsonl` (150 tasks)**.

Each task has a `goal`, an `env_name` (scenario), a `canonical_answer`, and `db_file`
(`datepicker_ood_grounded.db`). The grounded DB holds each task's `taskrecord`, so the task and its
scenario frontend correspond.

## Widget types & scenarios

The OOD split holds out **novel date-picker widgets** never shown in the in-distribution set. Each
task renders one (some compose two, e.g. `calendar_heatmap+time_only`):

| `datepicker_type` | Widget | What the agent does |
|---|---|---|
| `calendar_heatmap` | Calendar heatmap | pick a cell in a density-coloured grid |
| `wheel_scroller` | Scroll wheel | spin iOS-style date wheels |
| `week_picker` | ISO week picker | select a whole calendar week |
| `multi_date_picker` | Multi-date | pick several dates at once |
| `duration_picker` | Duration stepper | step an ISO duration up/down |
| `time_only` | Time-only clock | set hour/min/sec, no date |
| `quarter_picker` | Quarter picker | select a fiscal quarter |
| `fiscal_year_picker` | Fiscal-year picker | pick a fiscal year by decade |
| `timeline_slider` | Timeline slider | slide along a date axis |
| `relative_date_picker` | Relative date | resolve a relative phrase to a date |

Contexts (`category`) additionally include reasoning-, precision-, direct-gesture-, and
compound-completion-oriented scenarios. Each scenario is a Vite/React sub-app under
`frontend/envs/<scenario>/`.

## Databases

The grounded SQLite DB ships **with this environment** in this folder — no download needed:

| DB | Purpose |
|---|---|
| `datepicker_ood_grounded.db` | grounded task records used by the shipped test tasks |

## Grading

All tasks are `write`-type: the agent's submitted selection is recorded in `datesubmission`. Graded
by the repo-root `harness` LLM verifier, which judges the resulting database change against each
task's `reference_state_change`.
