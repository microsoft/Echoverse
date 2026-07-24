# nested_filter

> Part of the Echoverse **capability worlds** — narrow worlds that drill a single UI control
> across many layouts so an agent learns the skill, not one screen. See the top-level
> [README](../../README.md) and [Transparency Note](../../TRANSPARENCY.md).

A synthetic environment for evaluating computer-use agents on **nested / faceted filter**
widgets across 200 scenarios (widget families W01–W20, e.g. checkbox facets, range sliders,
cascading dropdowns, region pickers). Each task binds to one scenario's widget; the agent must
set the requested filter state.

## Run

```bash
cd envs/nested_filter
# --task selects the active scenario; the DB is rebuilt from committed seed data at startup:
uv run python -m backend.app --host 0.0.0.0 --port 5500 \
    --db ./nested_filter.db --task W01_E01_G001
```
Open `http://localhost:5500/env/<env_id>` (e.g. `/env/W01_E01`). Frontends are pre-rendered static
HTML under `frontend/<env_id>/` — no build step. The backend serves each scenario from its
`backend/data/<env_id>/` (env/seed/filter data) and grades submissions against the shipped
`tasks/test_tasks.jsonl`. Use the repo-root
`harness/` to run many instances concurrently.

## Tasks

Single test set: **`tasks/test_tasks.jsonl` (100 tasks)**.

Each task has a `goal`, an `env_id` (the scenario/widget it runs in), a `canonical_filter_state`
(the expected filter selection), and `db_file` (`nested_filter.db`). Every task's `env_id` has a
matching `frontend/<env_id>/` page and `backend/data/<env_id>/` scenario data, so the task and its
widget always correspond.

## Widget families & scenarios

Each task renders one **widget family** (`W01`–`W20`) in one scenario (`env_id`, e.g. `W04_E01`).
The families shipped in this test set:

| Family | `widget_category` | Widget / interaction |
|---|---|---|
| W01 | facet_selection | multi-select facet checkboxes |
| W02 | dropdown_choice | bucketed dropdown choice |
| W03 | autocomplete | autocomplete with disambiguation |
| W04 | range_input | min–max range slider |
| W05 | chip_selector | "at least" plus-chip selector |
| W06 | toggle | exact-match on/off toggle |
| W07 | modal_workflow | "more filters" modal workflow |
| W08 | active_filter_bar | active-filter chip bar |
| W09 | calendar | multi-month advancing calendar |
| W10 | calendar | explicit-year calendar |
| W13 | text_input | precise numeric text input |
| W14 | preset_toggle | preset toggle (e.g. "this month") |
| W15 | toggle | compatibility-vs-species toggle |
| W16 | calculator_dropdown | calculator compounding-frequency dropdown |
| W17 | calculator_input | override-default numeric calculator input |
| W18 | exclusive_select | exclusive property-type select |
| W19 | categorical_filter | composed categorical filters (sex + sterilization) |
| W20 | calculator_dropdown | cloud-region calculator dropdown |

Verticals span shopping, real-estate, finance, travel, cloud, and pet-adoption. Frontends are
pre-rendered static HTML under `frontend/<env_id>/`.

## Databases

The SQLite DB ships **with this environment** in this folder — no download needed (the backend also
rebuilds its DB from seed at startup, so the committed file is a snapshot):

| DB | Purpose |
|---|---|
| `nested_filter.db` | seed snapshot for the shipped test tasks |

## Grading

All tasks are `write`-type: the agent submits a filter state (`POST /env/<env_id>/api/submit`),
recorded in the `submissions` table. Graded by the repo-root `harness` LLM verifier, which judges
the resulting database change against each task's `reference_state_change`.
