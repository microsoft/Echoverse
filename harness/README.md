# Synthetic Env Harness

A small, self-contained toolkit to **run** the Echoverse synthetic environments and
**verify** agent tasks. It has no dependency on the internal packages
any internal/proprietary packages, Redis, Azure, or any private LLM
gateway. You bring your own agent; the harness only:

1. **launches an environment** for a task, with per-task database isolation and
   OS-assigned free ports (so you can run many instances at once), and
2. **grades the result** — LLM-based evaluation over any OpenAI-compatible API
   (OpenAI, Azure OpenAI with an API key, or Azure OpenAI with Azure AD
   credentials).

## Install

```bash
pip install -e harness            # deps: openai, requests, python-dotenv
# optional, only for large distributed runs:
pip install -e "harness[redis]"
# optional, for Azure AD (Entra ID) auth to Azure OpenAI:
pip install -e "harness[azure]"
```

Runtime prerequisites (same as running an env directly):

- **Python 3.10+**, **[uv](https://docs.astral.sh/uv/)**, **Node.js 18+** (for the env frontends)
- **`sqldiff`** (from the [SQLite tools bundle](https://www.sqlite.org/download.html)) —
  required for **LLM write-task verification**. `apt install sqlite3-tools`
  or `brew install sqlite`.
- **LLM credentials** — required for verification. The judge uses any
  OpenAI-compatible endpoint; config is read from the environment or a repo-root
  `.env` file (see [Verify a task](#verify-a-task)). Docs recommend `gpt-4o`.

## Environments

| Env name | Default port | DB | Test tasks |
|---|---|---|---|
| `echostay` | 8000 | `echostay.db` (download) | `tasks/test_tasks.jsonl` |
| `echoforge` | 8051 | `echoforge.db` (download) | `tasks/test_tasks.jsonl` |
| `datepickers` | 5400 | `datepicker_grounded.db` (download) | `tasks/test_tasks.jsonl` |
| `datepickers_ood` | 5401 | `datepicker_ood_grounded.db` (download) | `tasks/test_tasks.jsonl` |
| `nested_filter` | 5500 | `nested_filter.db` (download) | `tasks/test_tasks.jsonl` |
| `nested_filter_ood` | 5501 | `nested_filter_ood.db` (download) | `tasks/test_tasks.jsonl` |

All environment databases must be downloaded and placed in the env directory
before launching — none are committed to the repo. See the [TODO](#todo) below
(Hugging Face upload pending) and each env's README for the download location.

## Run one task

```bash
python -m harness.run_env --env echostay --task ATE0001 \
    --output-dir ./runs/ATE0001
```

This copies the seed DB, launches the backend + frontend on free ports, and
prints the URL your agent should drive. Press Ctrl-C to tear down; the post-run
database is captured to `./runs/ATE0001/final_db_state.db`.

### Programmatic use (context manager)

```python
from harness.launcher import EnvInstance

with EnvInstance("echostay", task_id="ATE0001",
                 output_dir="./runs/ATE0001") as inst:
    drive_my_agent(inst.url)          # your agent
# inst.final_db_path -> ./runs/ATE0001/final_db_state.db
```

## Run many instances at once

Each `EnvInstance` allocates its own free ports and its own DB copy, so instances
are fully isolated — just start several:

```python
from harness.launcher import EnvInstance

insts = [EnvInstance("echoforge", task_id=t).start() for t in task_ids]
try:
    run_agents_in_parallel([i.url for i in insts])
finally:
    for i in insts:
        i.close()
```

No Redis or Docker is required. (For very large distributed runs you can pass a
`harness.ports.RedisPortPool` as `port_allocator`, but this is optional.)

## Verify a task

Grading is **LLM-based**: a judge scores semantic equivalence via an
OpenAI-compatible model (recommended: `gpt-4o`). The judge prompts are the same
ones used to produce the benchmark's reference scores.

```bash
python -m harness.verify_cli --env echostay --task ABH0002 \
    --answer "Brighton"

python -m harness.verify_cli --env nested_filter --task W01_E03_G011 \
    --final-db ./runs/W01_E03_G011/final_db_state.db
```

It returns `PASS`/`FAIL` with a score of `1.0` or `0.0`.

### Configuring credentials (`.env`)

Config is read from the environment, or from a `.env` file at the repo root
(loaded automatically). The generic `LLM_*` keys are supported alongside the
conventional OpenAI / Azure names. Copy `.env.example` to `.env` and fill in one
of the following:

| Purpose | Generic key | OpenAI / Azure equivalents |
|---|---|---|
| Endpoint | `LLM_ENDPOINT` | `AZURE_OPENAI_ENDPOINT`, `OPENAI_BASE_URL` |
| API key | `LLM_API_KEY` | `AZURE_OPENAI_API_KEY`, `OPENAI_API_KEY` |
| Deployment | `LLM_DEPLOYMENT_NAME` | `AZURE_OPENAI_DEPLOYMENT` |
| Model | `LLM_MODEL_NAME` | `OPENAI_MODEL` |
| API version | `LLM_API_VERSION` | `OPENAI_API_VERSION` |

**Auth modes** (auto-detected, or force with `--auth {auto,openai,azure-key,azure-ad}`):

- **`openai`** — a non-Azure endpoint (or none) + an API key → plain OpenAI /
  OpenAI-compatible.
- **`azure-key`** — an `*.azure.com` endpoint **with** an API key → Azure OpenAI.
- **`azure-ad`** — an `*.azure.com` endpoint **without** an API key → Azure OpenAI
  authenticated via `DefaultAzureCredential` (`az login` / managed identity).
  Requires the `azure` extra (`pip install -e "harness[azure]"`).

## How task types are graded

Every env is graded uniformly by the LLM judge:

| Task type | How it is graded |
|---|---|
| `read` | judge compares the agent's answer to `reference_answer` |
| `write` | `sqldiff(seed, final)` is judged against `reference_state_change` |
| `read_write` | `min(read, write)` |

datepicker and nested_filter tasks are all `write`-style: the agent's action
records a row (`datesubmission` / `submissions`) that `sqldiff` surfaces, which
the write judge grades against `reference_state_change`.

## Package layout

```
harness/
  launcher.py    # EnvInstance: DB copy, ports, start/stop, final-DB capture
  ports.py       # free-port allocator (Redis pool optional)
  registry.py    # the six envs: dir / db / task files / per-task args
  verify.py      # LLM judges (verbatim): read + write + read_write
  llm.py         # OpenAI / Azure OpenAI client (API key or Azure AD)
  prompts.py     # judge prompts (verbatim, unchanged)
  sqltools.py    # run_sqldiff
  tasks.py       # load test tasks / find a task by id
  util.py        # jsonl loading / tolerant json parsing
  run_env.py     # CLI: launch one instance for a task
  verify_cli.py  # CLI: grade a task with the LLM judge
```

## TODO

- [ ] Replace the "download" DB sources above with the Hugging Face dataset link and
  download instructions, once the environment databases are published to Hugging Face.
