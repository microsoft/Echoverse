<div align="center">

# Echoverse — Synthetic Environments & Tasks

*Deep, behaviorally faithful web environments for training and evaluating computer-use agents.*

<!-- TODO: replace placeholder arXiv and blog URLs before public release -->
<a href="#"><img src="https://img.shields.io/badge/Paper-arXiv-b31b1b" alt="Paper"></a>
<a href="#"><img src="https://img.shields.io/badge/Blog-Post-6f42c1" alt="Blog"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License"></a>

</div>

---

**Echoverse** is an environment *factory* for computer-use agents: instead of scaling the
raw count of synthetic websites, it scales the **fidelity, depth, and correctness** inside each
one. A world here is more than a rendered page — it is real, resettable state, the actions that
change it, the consequences they produce, and a **database-grounded verifier** that checks the
outcome. The factory produces two kinds of world:

- **Full-domain worlds** (the **Echo family**) — faithful stand-ins for widely used products that
  preserve the causal structure of real work (shared threads, permissions, audit histories,
  consequential writes).
- **Capability worlds** — narrow worlds that drill a single control (e.g. a date picker or a
  nested filter) across many layouts, so an agent learns the *skill*, not one screen.

This repository is a **public release of a subset** of that factory: **four environments** with
their **test task sets**, plus a small standalone **[harness](harness/README.md)** that launches
an environment for a task, runs many instances concurrently, and verifies agent outcomes. Only
**test** tasks ship here. For the motivation, methodology, and results, see the
[paper](#) and [blog post](#).

Each environment is a self-contained **FastAPI backend + Vite/React frontend + SQLite** app that
serves a realistic web UI an agent can drive. Tasks are graded by an **LLM judge** over an
OpenAI-compatible API.

## Environments

This release ships **two full-domain worlds** and **two capability skills** (each with an
in-distribution and an out-of-distribution split):

| Environment | Kind | Port | Database | Test tasks | Description |
|---|---|---|---|---|---|
| [`echostay`](envs/echostay) | Full domain | 8000 | `echostay.db` (download) | 117 | Lodging marketplace (search, listings, bookings, wishlists) |
| [`echoforge`](envs/echoforge) | Full domain | 8051 | `echoforge.db` (download) | 101 | Developer collaboration / code hosting (projects, issues, merge requests) |
| [`datepickers`](envs/datepickers) | Capability | 5400 | download | 109 | Date-picker widget interactions (in-distribution) |
| [`datepickers_ood`](envs/datepickers_ood) | Capability | 5401 | download | 150 | Date-picker widgets (out-of-distribution) |
| [`nested_filter`](envs/nested_filter) | Capability | 5500 | download | 100 | Nested / faceted-filter widgets (in-distribution) |
| [`nested_filter_ood`](envs/nested_filter_ood) | Capability | 5501 | download | 145 | Nested / faceted-filter widgets (out-of-distribution) |

Ports are the per-env script defaults; the harness assigns free ports automatically so many
instances can run at once. **No databases are committed to this repository** — every environment
database (the four capability grounding DBs plus the larger `echostay.db` and `echoforge.db`) is
distributed separately and must be downloaded into its env directory before launching. See each
env's README and the [TODO](#todo) below for the download location.

> The full Echoverse domain suite is the **ten-environment Echo family** (EchoMail,
> EchoCalendar, EchoChat, EchoML, EchoForge, EchoBank, EchoCare, EchoForum, EchoTunes, EchoStay).
> This repository releases **EchoStay** and **EchoForge** plus the two capability worlds.

## TODO

- [ ] **Publish the environment databases to Hugging Face.** All six environment databases
  (`echostay.db`, `echoforge.db`, and the four capability grounding DBs) live outside git. Once
  they are pushed to Hugging Face, add the dataset link and download instructions here and in each
  environment's README. *(Complete this section once the Hugging Face DBs are live.)*

## Quick Start

Install the harness (deps: `openai`, `requests`, `python-dotenv`):

```bash
pip install -e harness
```

**Run an environment for a task** — copies the seed DB, launches backend + frontend on free
ports, and prints the URL your agent should drive:

```bash
python -m harness.run_env --env nested_filter \
    --task W20_E10_G001 --output-dir ./runs/W20_E10_G001
# ... drive your own agent at the printed URL ...
# Ctrl-C to tear down; the post-run DB lands in ./runs/W20_E10_G001/final_db_state.db
```

**Verify the result** — the judge reads its endpoint/credentials from the environment or a
repo-root `.env` (see [harness/README.md](harness/README.md#configuring-credentials-env)):

```bash
python -m harness.verify_cli --env nested_filter --task W20_E10_G001 \
    --final-db ./runs/W20_E10_G001/final_db_state.db
```

The judge works with OpenAI, Azure OpenAI (API key), or Azure OpenAI with Azure AD credentials
(`az login` / managed identity) — auto-detected, or forced with `--auth`.

You bring your own agent — the harness only launches the environment and grades the outcome. See
**[harness/README.md](harness/README.md)** for the full API, running many instances concurrently,
and per-family grading details.

## Verification

Every task carries its own answer key — a looked-up value or a state change **minted from the
environment's real database** — so success is a property of the app's own state, not a model's
read of a screenshot. Tasks are graded by an **LLM judge** over an OpenAI-compatible
API: read tasks compare the agent's answer to the reference value, write tasks compare the
database diff to the expected state change, and the judge only absorbs UI fuzz (rounding,
formatting, wording).

## Prerequisites

- **Python 3.10+** and **[uv](https://docs.astral.sh/uv/)**
- **Node.js 18+** (for the environment frontends)
- **`sqldiff`** (from the [SQLite tools bundle](https://www.sqlite.org/download.html)) — for
  LLM write-task verification (`apt install sqlite3-tools` / `brew install sqlite`)
- **LLM credentials** for the verifier — an OpenAI-compatible endpoint configured via the
  environment or a repo-root `.env` (OpenAI API key, Azure OpenAI API key, or Azure AD via
  `DefaultAzureCredential`). See [harness/README.md](harness/README.md#configuring-credentials-env).

## Repository structure

```
envs/                 # the released environments (backend/ + frontend/ + tasks + README)
  echostay/           #   full-domain world — lodging marketplace
  echoforge/          #   full-domain world — developer collaboration / code hosting
  datepickers/        #   capability world — date pickers (in-distribution)
  datepickers_ood/    #   capability world — date pickers (out-of-distribution)
  nested_filter/      #   capability world — nested filters (in-distribution)
  nested_filter_ood/  #   capability world — nested filters (out-of-distribution)
harness/              # standalone launcher + verifier (see harness/README.md)
```

## Attribution

Worlds are named for the **workflow** they represent rather than the brand they mirror.
**EchoStay** and **EchoForge** are synthetic stand-ins for **Airbnb** and **GitLab**, respectively;
the capability worlds are original. Their grounding data comes from public sources — EchoStay from
[InsideAirbnb](http://insideairbnb.com/), and EchoForge from the
[WebArena](https://github.com/web-arena-x/webarena) corpus. See each environment's README for
details on its data sources.

## Responsible AI

These environments and tasks are released for **research purposes**. Before using them, please
read the [Transparency Note](TRANSPARENCY.md), which describes intended uses, out-of-scope uses,
limitations, and best practices.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

This project has adopted the [Microsoft Open Source Code of Conduct](CODE_OF_CONDUCT.md). For more
information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or
comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use
of Microsoft trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion
or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those
third-party's policies.

## License

Released under the [MIT License](LICENSE). See [SECURITY.md](SECURITY.md) for security reporting.

## Citation

<!-- TODO: replace with the published citation on release -->
```bibtex
@misc{echoverse,
      title={Echoverse: Deep, Evolving Environments for Computer-Use Agents},
      author={TODO},
      year={2026}
}
```
