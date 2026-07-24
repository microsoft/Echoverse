# datepickers

> Part of the Echoverse **capability worlds** — narrow worlds that drill a single UI control
> across many layouts so an agent learns the skill, not one screen. See the top-level
> [README](../../README.md) and [Transparency Note](../../TRANSPARENCY.md).

A synthetic environment for evaluating computer-use agents on **date-picker widget**
interactions across ~100 realistic scenarios (banking, healthcare, travel, scheduling, …).
Each task binds to one scenario's UI; the agent must select the requested date(s) in that
scenario's widget.

## Run

```bash
cd envs/datepickers
# serve a single task (the scenario frontend is built on demand):
uv run python -m backend.app --host 0.0.0.0 --port 5400 \
    --db ./datepicker_grounded.db --task dpg_0008
```
Open `http://localhost:5400/task/<task_id>`. Each scenario's frontend is a Vite/React sub-app
under `frontend/envs/<scenario>/` (built to `dist/` on demand). The `run_datepickers.sh`
script can prebuild all scenarios.

The `harness/` launcher (repo root) handles per-task DB copies and free ports for running many
instances at once — see the top-level README.

## Tasks

Single test set: **`tasks/test_tasks.jsonl` (109 tasks)**.

Each task has a natural-language `goal`, an `env_name` (the scenario it runs in), a
`canonical_answer` (the expected selection, e.g. `2025-08-19|2025-03`), and `db_file`
(`datepicker_grounded.db`). The grounded DB holds each task's `taskrecord` (scenario + validation
SQL), so the task and its scenario frontend always correspond.

## Widget types & scenarios

Each task renders one of **6 core date-picker widget types**, re-themed across **10 everyday
contexts** (some tasks compose two widgets, e.g. `datetime+range`):

| `datepicker_type` | Widget | What the agent does |
|---|---|---|
| `datetime` | Date + time | pick a date plus a time-of-day |
| `single_date` | Single date | pick one calendar date |
| `range` | Date range | pick a start–end date span |
| `constrained` | Bounded date | pick a date within min/max limits |
| `dob` | Date of birth | enter a birthdate |
| `month_year` | Month / year | pick month and year only |

Contexts (`category`): `scheduling`, `events`, `profile`, `banking`, `lodging`, `travel`,
`delivery`, `insurance`, `medical`, `mixed`. Each scenario is a Vite/React sub-app under
`frontend/envs/<scenario>/`.

## Databases

The grounded SQLite DB is **not committed to the repository** — download it into this folder
before launching (see [TODO](#todo)):

| DB | Purpose |
|---|---|
| `datepicker_grounded.db` | grounded task records used by the shipped test tasks |

## Grading

All tasks are `write`-type. The agent submits a date selection (`POST /api/submit`), stored in the
`datesubmission` table. The repo-root `harness` LLM verifier grades the resulting database change
against each task's `reference_state_change` (the expected non-partial submission).

## TODO

- [ ] Add the Hugging Face download link and instructions for this environment's database
  here, once the DBs are published to Hugging Face.
