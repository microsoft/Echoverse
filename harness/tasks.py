"""Task-JSONL loading helpers shared by the CLI entrypoints."""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from . import registry
from .util import load_jsonl


def load_env_tasks(
    env_name: str, envs_root: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Load all test tasks for an env from its discovered test-task file(s)."""
    tasks: List[Dict[str, Any]] = []
    for path in registry.test_task_files(env_name, envs_root):
        if os.path.exists(path):
            tasks.extend(load_jsonl(path))
    return tasks


def find_task(
    env_name: str, task_id: str, envs_root: Optional[str] = None
) -> Dict[str, Any]:
    """Return the single task dict with ``id == task_id`` or raise."""
    for task in load_env_tasks(env_name, envs_root):
        if task.get("id") == task_id:
            return task
    raise KeyError(f"Task '{task_id}' not found in env '{env_name}'.")
