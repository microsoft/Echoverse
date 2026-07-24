# EchoForge

A DB-backed FastAPI + Vite/React synthetic environment for browser-agent tasks, modelling a
modern DevOps / code-hosting platform: projects (`namespace/path`), issues (open/closed, labels,
milestones, assignees, weight), merge requests (`!iid`, source→target branch, merge status),
threaded notes/comments, milestones with progress, labels, members (access levels), user profiles
(bio/location/organization/status), a to-do list, search, and a super-sidebar (Manage / Plan /
Code) navigation.

The frontend is an original re-skin kept fully consistent with the REST API and data model. A
README is backfilled per project so the Repository→Files view is grounded.

Data is the WebArena code-hosting corpus (2,399 users, 175 projects, 80,962 issues, 134,336 MRs,
303,407 notes, 545 milestones, 1,753 labels), shipped as a pre-built grounding DB
(download-required, below).

## Structure
- `backend/` — FastAPI + SQLModel/SQLite API (`app.py`, `routes.py`, `models.py`, `database.py`)
- `frontend/` — Vite/React SPA (built to `frontend/dist/`, served by the backend); theme in `src/echoforge.css`
- `tasks/` — the single test task set (`tasks/test_tasks.jsonl`, 101 tasks; see Tasks §)
- `ENV_FEATURES.txt` — UI feature map for the browser solver (routes, functional editors, global search)
- `run_echoforge.sh` — one-shot tmux launcher (single-server SPA + API on :8051)

## Grounding database
Relies on the pre-built `echoforge.db` (~344 MB) — NOT seeded/migrated at runtime.

This database is **not committed to the repository**. Download it and place it at
`envs/echoforge/echoforge.db` — see the [TODO](#todo) below for the download location
(Hugging Face upload pending).

## Build & run
```bash
cd envs/echoforge
./run_echoforge.sh                    # uv sync + npm build + launch on :8051
# or manually:
uv sync
(cd frontend && npm install && npm run build)
uv run python -m backend.app --host 0.0.0.0 --port 8051 --db ./echoforge.db --user 2330
```
Open http://localhost:8051. API docs at `/docs`, API under `/api`. The `--user N` flag makes every
request behave as if user N is logged in (no login form). Default eval user `byteblaze` = id `2330`.

## UI notes
- Super-sidebar (Manage/Plan/Code) + light chrome.
- Project overview (avatar, visibility, ⭐ stars / 🍴 forks, topics, README), issues list + detail
  (right metadata sidebar, activity feed, Close/Reopen), MR list + detail (Overview/Changes tabs),
  milestones with progress, colored labels, members with access levels, profile + to-do list.
- A real `README.md` is backfilled per project (grounded from name/description/topics) so
  Repository→Files is populated. No commits/pipelines/branches data → those areas show empty states.
- Issue detail has inline Edit title / Assignee / Weight editors; profiles at `/users/<username>`;
  global search surfaces Users alongside projects/issues/MRs; the dashboard loads widgets with
  `Promise.allSettled` so a single failing widget doesn't blank the page.

## Tasks

The env ships a single test set: **`tasks/test_tasks.jsonl` (101 tasks)**.

Every task carries a natural-language `goal`, a `task_type` (`read` / `write` / `read_write`),
and a self-contained `verification_query` (plus `reference_answer` for reads and
`reference_state_change` for writes), so it can be graded directly against the env database.
Tasks exercise issues & merge requests, project/repo browsing, milestones, labels, comments/notes,
and member/settings views.

## Attribution

**EchoForge** is part of the Echoverse **Echo family** of full-domain worlds and is a synthetic
stand-in for **GitLab**, named for the workflow rather than the brand. Its project/issue/merge-request/user
data is derived from the [WebArena](https://github.com/web-arena-x/webarena) corpus. See the top-level
[README](../../README.md) and [Transparency Note](../../TRANSPARENCY.md) for full attribution.

## TODO

- [ ] Add the Hugging Face download link and instructions for this environment's database
  here, once the DBs are published to Hugging Face.
