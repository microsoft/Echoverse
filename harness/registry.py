"""Registry of the released synthetic environments.

Encodes, for each of the six release envs, where its code lives, which seed
database it uses by default, its single canonical test-task file, and how its
backend is parameterized per task. This is the single place that captures the
per-env launch quirks so the launcher and verifier stay generic.

Each env ships exactly ONE test-task file (``EnvSpec.test_task_file``), named
explicitly here so the same file is referenced and used everywhere.

Notes on per-env conventions:

- echostay / echoforge: single-page apps; the acting user is fixed via ``--user``
  (default differs per env). Seed DBs are large and are NOT committed — they must
  be downloaded (see the release docs).
- datepickers (in / ood): per-task backend selected via ``--task``; each task's
  record lives in the committed grounded DB (``datepicker[_ood]_grounded.db``),
  which the env uses by default.
- nested_filter (in / ood): per-task backend selected via ``--task``; the DB is
  rebuilt from committed seed data and is also committed as a snapshot.

All envs are graded uniformly by the LLM verifier (:mod:`harness.verify`): read
tasks against ``reference_answer`` and write tasks against ``reference_state_change``
via an ``sqldiff`` of the seed vs final database.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass(frozen=True)
class EnvSpec:
    """Static description of one released environment."""

    name: str
    dir_name: str
    default_db: str
    # The single canonical test-task file for this env, relative to the env dir.
    # Each released env ships exactly ONE task file; this names it explicitly so
    # the same file is referenced and used everywhere.
    test_task_file: str
    # Fixed extra backend args always passed (e.g. the acting user). Per-task
    # args (like {"task": ...}) come from the task's ``extra_website_args``.
    fixed_backend_args: Dict[str, str] = field(default_factory=dict)
    # The task-JSON field whose value should be passed as --<task_arg_key>, if
    # the backend selects behavior per task (datepickers / nested_filter).
    task_arg_key: Optional[str] = None
    default_port: int = 8000


REGISTRY: Dict[str, EnvSpec] = {
    "echostay": EnvSpec(
        name="echostay",
        dir_name="echostay",
        default_db="echostay.db",
        test_task_file="tasks/test_tasks.jsonl",
        fixed_backend_args={"user": "1"},
        default_port=8000,
    ),
    "echoforge": EnvSpec(
        name="echoforge",
        dir_name="echoforge",
        default_db="echoforge.db",
        test_task_file="tasks/test_tasks.jsonl",
        fixed_backend_args={"user": "2330"},
        default_port=8051,
    ),
    "datepickers": EnvSpec(
        name="datepickers",
        dir_name="datepickers",
        default_db="datepicker_grounded.db",
        test_task_file="tasks/test_tasks.jsonl",
        task_arg_key="task",
        default_port=5400,
    ),
    "datepickers_ood": EnvSpec(
        name="datepickers_ood",
        dir_name="datepickers_ood",
        default_db="datepicker_ood_grounded.db",
        test_task_file="tasks/test_tasks.jsonl",
        task_arg_key="task",
        default_port=5401,
    ),
    "nested_filter": EnvSpec(
        name="nested_filter",
        dir_name="nested_filter",
        default_db="nested_filter.db",
        test_task_file="tasks/test_tasks.jsonl",
        task_arg_key="task",
        default_port=5500,
    ),
    "nested_filter_ood": EnvSpec(
        name="nested_filter_ood",
        dir_name="nested_filter_ood",
        default_db="nested_filter_ood.db",
        test_task_file="tasks/test_tasks.jsonl",
        task_arg_key="task",
        default_port=5501,
    ),
}


def get_env_spec(name: str) -> EnvSpec:
    """Return the :class:`EnvSpec` for ``name`` or raise a helpful error."""
    if name not in REGISTRY:
        raise KeyError(
            f"Unknown env '{name}'. Known envs: {', '.join(sorted(REGISTRY))}."
        )
    return REGISTRY[name]


def envs_root(explicit: Optional[str] = None) -> str:
    """Resolve the directory that contains the env folders.

    Order: explicit arg → ``ENVS_ROOT`` env var → the repo's ``envs/`` inferred
    from this file's location (``<repo>/harness/registry.py`` → ``<repo>/envs``).
    """
    if explicit:
        return os.path.abspath(explicit)
    env_var = os.environ.get("ENVS_ROOT")
    if env_var:
        return os.path.abspath(env_var)
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(here, "..", "envs"))


def env_dir(name: str, envs_root_path: Optional[str] = None) -> str:
    """Absolute path to an env's directory."""
    spec = get_env_spec(name)
    return os.path.join(envs_root(envs_root_path), spec.dir_name)


def default_db_path(name: str, envs_root_path: Optional[str] = None) -> str:
    """Absolute path to an env's default seed database."""
    spec = get_env_spec(name)
    return os.path.join(env_dir(name, envs_root_path), spec.default_db)


def test_task_file(name: str, envs_root_path: Optional[str] = None) -> str:
    """Absolute path to the env's single canonical test-task file."""
    spec = get_env_spec(name)
    return os.path.join(env_dir(name, envs_root_path), spec.test_task_file)


def test_task_files(name: str, envs_root_path: Optional[str] = None) -> List[str]:
    """Return the env's test-task file(s) as a single-element list.

    Each released env ships exactly ONE task file (``spec.test_task_file``); this
    returns it (wrapped in a list) when present, so callers that iterate over
    files keep working.
    """
    path = test_task_file(name, envs_root_path)
    return [path] if os.path.exists(path) else []
