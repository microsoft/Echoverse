"""Small utilities: JSONL loading and tolerant JSON parsing.

``load_jsonl`` and ``attempt_parse_json`` are reimplemented (dependency-free) to
match the behavior of the internal ``webeval.utils`` helpers the verifier relied
on.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List


def load_jsonl(filepath: str) -> List[Dict[str, Any]]:
    """Load a JSON-lines file into a list of dicts, skipping blank lines."""
    items: List[Dict[str, Any]] = []
    with open(filepath, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            items.append(json.loads(line))
    return items


def attempt_parse_json(json_str: str) -> Dict[str, Any]:
    """Best-effort parse of an LLM JSON reply.

    Strips ```json ... ``` / ``` ... ``` fences if present, then falls back to a
    permissive ``eval`` for near-JSON (e.g. single quotes) — matching the
    behavior the verifier expected from the model output.
    """
    assert isinstance(json_str, str)
    if "```json" in json_str:
        json_str = json_str.split("```json")[1].split("```")[0].strip()
    elif "```" in json_str:
        json_str = json_str.split("```")[1].split("```")[0].strip()
    try:
        r = json.loads(json_str)
    except json.JSONDecodeError:
        r = eval(json_str)  # noqa: S307 - permissive fallback for near-JSON model output
    return r
