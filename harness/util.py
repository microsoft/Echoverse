"""Small utilities: JSONL loading and tolerant JSON parsing.

``load_jsonl`` and ``attempt_parse_json`` are reimplemented (dependency-free) to
match the behavior of the internal ``webeval.utils`` helpers the verifier relied
on.
"""

from __future__ import annotations

import ast
import json
import re
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


_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL)


def _strip_fences(text: str) -> str:
    m = _FENCE_RE.search(text)
    return m.group(1).strip() if m else text.strip()


def _outermost_object(text: str) -> str:
    """Return the substring from the first ``{`` to the last ``}`` (or ``text``)."""
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        return text[start : end + 1]
    return text


def attempt_parse_json(json_str: str) -> Dict[str, Any]:
    """Best-effort parse of an LLM JSON reply.

    Strips ```json ... ``` / ``` ... ``` fences if present, then falls back to a
    permissive parse for near-JSON (e.g. single quotes, ``True``/``None``).

    The fallback uses :func:`ast.literal_eval`, which only accepts Python
    literals. Model output must **never** be passed to ``eval``: the judge
    prompt embeds agent-controlled text (the agent's answer, the sqldiff of a
    database the agent wrote to), so a judge that echoes it would hand the
    harness arbitrary code to execute.

    Returns ``{}`` when nothing parseable is found so callers grade it as a
    fail instead of crashing (or executing anything).
    """
    assert isinstance(json_str, str)
    body = _strip_fences(json_str)
    for candidate in (body, _outermost_object(body)):
        try:
            r = json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            try:
                r = ast.literal_eval(candidate)
            except (ValueError, SyntaxError, TypeError, MemoryError, RecursionError):
                continue
        if isinstance(r, dict):
            return r
    return {}
