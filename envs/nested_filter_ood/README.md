# nested_filter_ood

> Part of the Echoverse **capability worlds** — the out-of-distribution nested-filter split, held
> out for evaluation. See the top-level [README](../../README.md) and
> [Transparency Note](../../TRANSPARENCY.md).

An **out-of-distribution** counterpart to `nested_filter`: novel filter-widget families
(W21–W30, e.g. date-range flight/hotel filters, calculator dropdowns, bespoke toggles) the
in-distribution set does not cover. Test-only.

## Run

```bash
cd envs/nested_filter_ood
uv run python -m backend.app --host 0.0.0.0 --port 5501 \
    --db ./nested_filter_ood.db --task W21_E01_G001
```
Open `http://localhost:5501/env/<env_id>` (e.g. `/env/W21_E01`). Frontends are pre-rendered static
HTML under `frontend/<env_id>/`; the backend serves each scenario from its `backend/data/<env_id>/`
(env/seed/filter data) and grades submissions against the shipped `tasks/test_tasks.jsonl`.
Use the repo-root `harness/` to run many instances concurrently.

## Tasks

Single test set: **`tasks/test_tasks.jsonl` (145 tasks)**.

Each task has a `goal`, an `env_id` (scenario), a `canonical_filter_state`, and `db_file`
(`nested_filter_ood.db`). Every task's `env_id` has a matching `frontend/<env_id>/` page and
`backend/data/<env_id>/` scenario data.

## Widget families & scenarios

The OOD split holds out **compound-panel families** (`W21`–`W30`) that combine two in-distribution
controls into one panel. The families shipped in this test set:

| Family | `widget_category` | Combined widgets |
|---|---|---|
| W21 | combo_calendar | calendar advance + return-date validation |
| W22 | combo_realestate_facets | min–max slider + plus-chip (real-estate facets) |
| W23 | combo_modal_workflow | "more filters" modal + chip bar |
| W24 | combo_facet_strict | multi-checkbox + exact-match (strict facets) |
| W25 | combo_realestate_filters | plus-chip + property-type (real-estate filters) |
| W26 | combo_booking_destination_date | autocomplete destination + calendar advance (booking) |
| W27 | combo_pet_filters | sex/sterilization + species compatibility (pet filters) |
| W29 | combo_calculator_full_override | override defaults + frequency (full calculator) |
| W30 | combo_cloud_calculator | region + override defaults (cloud calculator) |

Frontends are pre-rendered static HTML under `frontend/<env_id>/`.

## Databases

The SQLite DB is **not committed to the repository** — the backend rebuilds its DB from seed at
startup, or download the snapshot into this folder (see [TODO](#todo)):

| DB | Purpose |
|---|---|
| `nested_filter_ood.db` | seed snapshot for the shipped test tasks |

## Grading

All tasks are `write`-type: the agent's submitted filter state is recorded in the `submissions`
table. Graded by the repo-root `harness` LLM verifier, which judges the resulting database change
against each task's `reference_state_change`.

## TODO

- [ ] Add the Hugging Face download link and instructions for this environment's database
  here, once the DBs are published to Hugging Face.
